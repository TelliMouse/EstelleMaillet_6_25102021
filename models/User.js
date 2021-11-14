const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

//The uniqueValidator plugin prevents user from using a single email address to create multiple account
const userSchema = mongoose.Schema({
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true}
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);