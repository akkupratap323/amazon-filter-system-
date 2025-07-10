/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.csv$/,
      loader: 'file-loader',
      options: {
        publicPath: '/_next/static/files/',
        outputPath: 'static/files/',
      },
    });
    return config;
  },
}

module.exports = nextConfig
