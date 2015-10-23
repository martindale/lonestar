var config = require('../config');

var Maki = require('maki');
var lone_star = new Maki(config);

var Passport = require('maki-passport-local');
var passport = new Passport({
  resource: 'Person'
});

var Auth = require('maki-auth-simple');
var auth = new Auth({
  resource: 'People'
});

lone_star.use(passport);
lone_star.use(auth);

var Post = lone_star.define('Post', {
  auth: ['admin'],
  attributes: {
    title: { type: String , max: 240 , slug: true },
    content: { type: String },
    created: { type: Date , default: Date.now },
    _author: {
      type: lone_star.mongoose.SchemaTypes.ObjectId,
      ref: 'Person',
      populate: ['query', 'get'],
      required: true
    }
  },
  icon: 'file text'
});

/**
 * A human that can log in and author content
 */
var Person = lone_star.define('Person', {
  auth: ['admin'],
  replicate: false,
  icon: 'user',
  attributes: {
    email: { type: String , max: 200 },
    username: { type: String , slug: true , max: 200 },
    password: { type: String , masked: true , max: 200 },
    created: { type: Date , default: Date.now }
  },
  requires: {
    'Post': {
      limit: 20,
      filter: function() {
        var person = this;
        return { _author: person._id };
      },
      populate: '_author'
    }
  }
});

/**
 * A motor that drives things
 */
var Motor = lone_star.define('Motor', {
  auth: ['admin'],
  replicate: false,
  icon: 'setting',
  attributes: {
    make: { type: String, max: 200 },
    model: { type: String, max: 200 },
    kv: { type: Number , min: 0 },
    created: { type: Date , default: Date.now }
  },
});

/**
 * A propeller that spins
 */
var Propeller = lone_star.define('Propeller', {
  auth: ['admin'],
  replicate: false,
  icon: 'repeat',
  attributes: {
    make: { type: String , max: 200 },
    model: { type: String, max: 200 },
    length: { type: Number, min: 0 },
    pitch: { type: Number, min: 0 },
    composition: { type: String, max: 200 },
    created: { type: Date , default: Date.now }
  },
});

/**
 * A combination of a motor and prop
 */
var Powerplant = lone_star.define('Powerplant', {
  auth: ['admin'],
  replicate: false,
  icon: 'lightning',
  attributes: {
    _motor: {
      type: lone_star.mongoose.SchemaTypes.ObjectId,
      ref: 'Motor',
      populate: ['query', 'get'],
      required: true
    },
    _propeller: {
      type: lone_star.mongoose.SchemaTypes.ObjectId,
      ref: 'Propeller',
      populate: ['query', 'get'],
      required: true
    },
    created: { type: Date , default: Date.now }
  },
  requires: {
    'Motor': {
      populate: '_motor'
    },
    'Propeller': {
      populate: '_propeller'
    }
  }
});

lone_star.define('Index', {
  routes: { query: '/' },
  templates: { query: 'index' },
  static: true,
  internal: true,
  requires: {
    'Post': {
      populate: '_author'
    }
  }
});

lone_star.define('Lab', {
  routes: { query: '/lab' },
  templates: { query: 'lab' },
  static: true,
  internal: true,
  requires: {
    'Post': {
      populate: '_author'
    }
  }
});

module.exports = lone_star;
