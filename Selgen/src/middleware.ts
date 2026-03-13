import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'development-secret-key'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const allCookies = request.cookies.getAll()
  
  console.log('Middleware - All cookies:', allCookies.map(c => c.name))
  console.log('Middleware - Path:', request.nextUrl.pathname, 'Token:', token ? 'yes' : 'no')

  // 公开路径
  const publicPaths = ['/', '/auth/signin', '/auth/signup', '/auth/error', '/api/auth', '/api/login', '/api/register', '/api/auth/me', '/api/auth/logout']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isPublicPath) {
    return NextResponse.next()
  }

  console.log('Middleware - Path:', request.nextUrl.pathname, 'Token:', token ? 'yes' : 'no')

  // 如果没有 token 且不是公开路径，重定向到登录页
  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // 验证 token
  try {
    const decoded = verify(token, JWT_SECRET) as any
    
    console.log('Middleware - User:', decoded.email)
    
    // 将用户信息添加到请求头
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', decoded.id)
    requestHeaders.set('x-user-email', decoded.email)
    requestHeaders.set('x-user-name', decoded.name || '')

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    // token 无效，重定向到登录页
    console.log('Middleware - Token invalid')
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * 排除以下路径：
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
