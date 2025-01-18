/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
      AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
      AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
      AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
      AUTH0_REDIRECT_URI: process.env.AUTH0_REDIRECT_URI,
      AUTH0_POST_LOGOUT_REDIRECT_URI: process.env.AUTH0_POST_LOGOUT_REDIRECT_URI,
    },
};

export default nextConfig;
