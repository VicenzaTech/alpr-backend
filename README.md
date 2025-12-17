<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ yarn install
```

## Environment variables

Authentication guards rely on both Supabase and Firebase backends. Besides the existing Supabase keys, configure the following Firebase Admin credentials in your `.env` file (or your deployment secrets):

- `FIREBASE_PROJECT_ID` - Firebase project id.
- `FIREBASE_CLIENT_EMAIL` - `client_email` from the service account JSON.
- `FIREBASE_PRIVATE_KEY` - `private_key` from the service account. Keep the literal `\n` line breaks if you paste it on a single line.

These values allow the backend to verify Firebase ID tokens and attach the authenticated user to each request.

Auth v3 (Passport + JWT) requires two additional variables:

- `JWT_SECRET` - symmetric key used to sign the JWT access tokens. Set a strong, unique value per environment.
- `JWT_EXPIRES_IN` - optional, defaults to `1h`. Supports any value accepted by [`jsonwebtoken`](https://github.com/auth0/node-jsonwebtoken#token-expiration-exp-claim) (e.g. `3600` or `15m`).
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` - OAuth credentials from the Google Cloud console. The callback must match the `/api/v3/auth/google/callback` route you expose publicly.
- `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_CALLBACK_URL` - OAuth credentials from the Meta for Developers portal. Point the callback to `/api/v3/auth/facebook/callback`.

## Auth v2 (Firebase)

- `POST /api/v2/auth/register`: registers a Firebase Auth user (email/password) through the Admin SDK, persists the mirrored record inside PostgreSQL, and returns both the stored user and a Firebase custom token for immediate sign-in.
- `POST /api/v2/auth/login`: pass the Firebase `idToken` (and optional profile overrides such as `fullName`, `phone`, `position`, etc.). The backend verifies the token with Firebase Admin, syncs the user profile into PostgreSQL, and returns the stored user record alongside Firebase metadata.
- `GET /api/v2/auth/me`: requires the `Authorization: Bearer <idToken>` header. The `FirebaseAuthGuard` validates the token and responds with the current user profile.

Use these endpoints when the frontend authenticates directly with Firebase; Supabase-based routes remain for legacy clients.

## Auth v3 (Passport + JWT)

- `POST /api/v3/auth/register`: registers a local user stored directly in PostgreSQL. Passwords are hashed with `bcryptjs` and JWT-ready metadata is returned.
- `POST /api/v3/auth/login`: protected by Passport's `local` strategy (email + password). Successful requests receive a signed JWT (`Authorization: Bearer ...`).
- `GET /api/v3/auth/me`: requires the JWT access token. The `JwtAuthGuard` validates the token and resolves the persisted user profile.
- `GET /api/v3/auth/google` → `GET /api/v3/auth/google/callback`: starts the Google OAuth flow and exchanges the verified Google profile for a JWT session.
- `GET /api/v3/auth/facebook` → `GET /api/v3/auth/facebook/callback`: same for Facebook Login.

Use these endpoints whenever the backend should own the entire authentication lifecycle without delegating to Supabase or Firebase.

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
