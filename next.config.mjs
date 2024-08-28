/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  // distDir: 'orora-web-client',
};

export default nextConfig;

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   eslint: {
//     dirs: ['src'],
//   },
//   // async headers() {
//   //   return [
//   //     {
//   //       source: '/api/:path*',
//   //       headers: [
//   //         { key: 'Access-Control-Allow-Credentials', value: 'true' },
//   //         { key: 'Access-Control-Allow-Origin', value: '*' },
//   //         {
//   //           key: 'Access-Control-Allow-Methods',
//   //           value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
//   //         },
//   //         {
//   //           key: 'Access-Control-Allow-Headers',
//   //           value:
//   //             'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
//   //         },
//   //       ],
//   //     },
//   //   ];
//   // },

//   // output: 'export',
//   target: 'serverless',
// };

// export default nextConfig;
