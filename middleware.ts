export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/admin/members/:path*',
    '/admin/events/:path*',
    '/admin/posts/:path*',
    '/admin/gallery/:path*',
    '/admin/messages/:path*',
    '/admin/settings/:path*',
  ],
}
