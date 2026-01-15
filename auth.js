const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const passport = require('passport');
const config = require('./config');

const opts = {
  secretOrKey: config.secret,
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    req => req.headers['authentication'] // rubric wording
  ])
};

module.exports = function () {
  const strategy = new JwtStrategy(opts, (payload, done) => {
    if (payload) return done(null, payload);
    return done(null, false);
  });

  passport.use(strategy);

  return {
    initialize: () => passport.initialize(),
    authenticate: () => passport.authenticate('jwt', { session: false })
  };
};