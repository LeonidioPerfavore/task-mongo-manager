const Task = require('../models/tasks')
const asyncWrapper = require('../middleware/asyncWrapper')
const {createCustomError} = require('../errors/custom-api-error')

const getAllTasks = asyncWrapper(async (req, res) => {

    const tasks = await Task.find({})

    res.status(200).json({status: 'success', data: {tasks, nbHits: tasks.length}})

})

const createTask = asyncWrapper(async (req, res, next) => {

    const taskDuplicate = await Task.findOne({ name: req.body.name })
    if (taskDuplicate) {
        return next(createCustomError(`This task already exists.`, 400))
    }

    const task = await Task.create({name: req.body.name})

    res.status(201).json({status: 'success', data: {task}})

})

const getTask = asyncWrapper(async (req, res, next) => {
    const { id: taskID } = req.params
    const task = await Task.findOne({ _id: taskID })
    if (!task) {
        return next(createCustomError(`No task with id : ${taskID}`, 404))
    }

    res.status(200).json({ task })
})

const updateTask = asyncWrapper(async (req, res, next) => {

    const {id:taskId} = req.params

    const taskDuplicate = await Task.findOne({'_id': {$ne : [taskId]}, name: req.body.name})
    if (taskDuplicate) {
        return next(createCustomError(`Task with this name already exists.`, 400))
    }

    const task = await Task.findOneAndUpdate({_id:taskId}, req.body, {
        new: true,
        runValidators: true
    })
    if(!task){
        return next(createCustomError(`No task with id : ${taskID}`, 404))
    }
    res.status(200).json({taskDuplicate});
})

const deleteTask = asyncWrapper(async (req, res) => {

    const {id:taskId} = req.params
    const task = await Task.findOneAndDelete({_id:taskId})

    if(!task){
        res.status(404).json({msg:`No task with id: ${taskId}`})
        return;
    }
    res.status(200).json({msg: `Task with id: ${taskId} deleted.`});
})

module.exports = {
    getAllTasks,
    createTask,
    getTask,
    updateTask,
    deleteTask
}