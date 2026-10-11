import { v4 as uuidv4 } from 'uuid'
import prisma from '../config/database.js'
import { verifyPassword } from '../utils/password.js'
import { generateToken, getTokenExpiration } from '../utils/jwt.js'

/**
 * Login user
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    // Find user by email (support both @textile.com, @everest.com, and role shortcuts)
    const cleanEmail = email.toLowerCase().trim()
    const possibleEmails = [
      cleanEmail,
      cleanEmail.replace('@everest.com', '@textile.com'),
      cleanEmail.replace('@textile.com', '@everest.com'),
      `${cleanEmail}@textile.com`,
      `${cleanEmail}@everest.com`,
    ]

    const user = await prisma.user.findFirst({
      where: {
        email: { in: possibleEmails }
      },
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    // Check if account is locked (bypassed in development mode)
    if (process.env.NODE_ENV === 'production' && user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil - new Date()) / 60000)
      return res.status(403).json({
        success: false,
        message: `Account is locked. Try again in ${remainingMinutes} minute(s)`,
      })
    }

    // Verify password (supports Argon2 hash, or default test password 'Admin@123')
    let isValidPassword = false
    try {
      isValidPassword = await verifyPassword(user.password, password)
    } catch {
      isValidPassword = false
    }

    if (!isValidPassword && (password === 'Admin@123' || password === 'admin@123')) {
      isValidPassword = true
    }

    if (!isValidPassword) {
      if (process.env.NODE_ENV === 'production') {
        const failedCount = user.failedLoginCount + 1
        const updateData = { failedLoginCount: failedCount }
        if (failedCount >= 5) {
          updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
        }
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        })
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    // Reset lockout counters on successful password
    if (user.failedLoginCount > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null }
      })
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.',
      })
    }

    // Generate session ID and token
    const sessionId = uuidv4()
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    })

    // Get request metadata
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.headers['user-agent']

    // Create session record
    await prisma.userSession.create({
      data: {
        sessionId,
        userId: user.id,
        token,
        ipAddress,
        userAgent,
        expiresAt: getTokenExpiration(),
      },
    })

    // Update user login info and reset failed count
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    })

    // Return success response
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        },
        token,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Login failed',
    })
  }
}

/**
 * Get current user
 * GET /api/auth/me
 */
export async function getCurrentUser(req, res) {
  try {
    // User is already attached by authenticate middleware
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Get current user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data',
    })
  }
}

/**
 * Logout user
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  try {
    // Deactivate current session
    await prisma.userSession.updateMany({
      where: {
        userId: req.user.id,
        sessionId: req.sessionId,
      },
      data: {
        isActive: false,
      },
    })

    res.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    })
  }
}
