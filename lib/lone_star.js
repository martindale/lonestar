var config = require('../config');

var _ = require('lodash');
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

var csv = require('csv');
var through2 = require('through2');

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
var Powertrain = lone_star.define('Powertrain', {
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

var Measurement = lone_star.define('Measurement', {
  auth: ['admin'],
  replicate: false,
  icon: 'lightning',

  attributes: {
    data: { type: 'File', required: true},
    hash: { type: String , max: 32 , render: { create: false } },
    _powertrain: {
      type: lone_star.mongoose.SchemaTypes.ObjectId,
      ref: 'Powertrain',
      populate: ['query', 'get'],
      required: true
    },
    created: { type: Date , default: Date.now }
  },
  requires: {
    'Powertrain': {
      populate: '_powertrain'
    }
  }
});

Measurement.pre('create', function(next, done) {
  var measurement = this;
  if (!measurement.data) return next();
  return next();
});

Measurement.on('file:data', function(data) {
  var output = [];

  mapping = {
    'Run #': 'run',
    'Voltage': 'voltage',
    'PWM Duty Cycle': 'trottle',
    'Current (A)': 'current',
    'Thrust (Grams)': 'thrust'
  }
  var processInput = csv.transform(function(record) {
      cleaned = _.reduce(record, function(result, value, key) {
        if (mapping[key]) {
          result[mapping[key]] = value;
        }
        return result;
      }, {});
      return cleaned;
    })
  lone_star.datastore.gfs.createReadStream({ _id: data._id })
    .pipe(csv.parse({columns: true}))
    .pipe(processInput)
    .pipe(through2.obj(function (chunk, enc, callback) {
      this.push(JSON.stringify(chunk))
      callback()
    }))
    .on('data', function(data) {
      console.log(data);
    })
    .on('end', function() {
      console.log("Done!");
    });
  // function streamToString(stream, cb) {
  //   const chunks = [];
  //   stream.on('data', function(chunk) {
  //     chunks.push(chunk);
  //   });
  //   stream.on('end', function() {
  //     cb(chunks.join(''));
  //   });
  // }
  // streamToString(file, function(data) {
  //   parse(data, function(err, output) {
  //     console.log(output)
  //   });
  // });
});

var Checksum = lone_star.define('Checksum', {
  attributes: {
    filename: { type: String },
    _file: { type: lone_star.mongoose.SchemaTypes.ObjectId },
    _data: { type: lone_star.mongoose.SchemaTypes.ObjectId },
    hash: { type: String , max: 35 },
    type: { type: String , enum: ['md5'] },
    created: { type: Date , default: Date.now }
  },
  icon: 'lock'
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
