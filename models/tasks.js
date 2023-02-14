const mongoose = require('mongoose')

const TaskSchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true, 'name required'],
        minLength:[2, 'name is to short'],
        trim:true
    },
    completed:{
        type: Boolean,
        default: false
    }
})

TaskSchema.set('timestamps', true)

module.exports = new mongoose.model('Task', TaskSchema)