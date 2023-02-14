const tasksDOM = document.querySelector('.tasks')
const loadingDOM = document.querySelector('.loading-text')
const formDOM = document.querySelector('.task-form')
const createTaskInputDOM = document.querySelector('.task-input')
const formAlertDOM = document.querySelector('.form-alert')

function formatTheDate(date){
    let d = new Date(date)
    return d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear()
}

function showMessage(message, color){
    formAlertDOM.style.opacity = '1'
    formAlertDOM.innerHTML = message
    formAlertDOM.classList.add(color)
}

function validate(name){
    let nameValidation = true;
    let nameLengthValidation = true;

    if(!name){
        showMessage(`Add name`, 'warning-color')
        nameValidation = false
    }

    if(nameValidation && name && name.length < 2){
        showMessage(`Name is to short`, 'warning-color')
        nameLengthValidation = false;
    }

    return nameValidation && nameLengthValidation
}

function turnOffEditing(textarea, editIcon, undoIcon, checkbox, paragraph, returnOriginTask, originPrevTaskStatus){
    editIcon.classList.remove('active-edit-color')
    textarea.setAttribute('readonly', true)
    textarea.classList.add('display-none')
    checkbox.classList.add('opacity-0')
    checkbox.disabled = true
    undoIcon.classList.add('display-none')
    paragraph.classList.remove('display-none')
    if(returnOriginTask){
        textarea.value = paragraph.innerHTML
        checkbox.checked = originPrevTaskStatus.checked
    }
}

function activateEditing(editIcon, textarea, checkbox, undoEditing){
    editIcon.classList.add('active-edit-color');
    textarea.removeAttribute('readonly')
    textarea.classList.remove('display-none')
    checkbox.classList.remove('opacity-0')
    checkbox.disabled = false
    undoEditing.classList.remove('display-none')
}

function checkError(error){
    if(error.response.status === 400){
        showMessage(error.response.data.msg, 'warning-color')
    }else{
        showMessage(`Error, please try again`, 'warning-color')
    }
}

const showTasks = async () => {
    loadingDOM.style.visibility = 'visible'
    let tasks = []
    let data = null
    await axios.get('/api/v1/tasks').then(resp => {

        data = resp.data
        tasks = data.data.tasks

        if (tasks.length < 1) {
            tasksDOM.innerHTML = '<h5 class="main-color">No tasks in your list</h5>'
            loadingDOM.style.visibility = 'hidden'
            return
        }

        tasksDOM.innerHTML = tasks
            .map((task) => {
                return `<div class="single-task" id="${task._id}">
                            <div class="header-textarea-wrapper">
                            <h5 class="${task.completed ? 'completed-color' : 'main-color'}">
                                ${task.completed ? `<span><i class="far fa-check-circle"></i></span>` : ''}
                                ${formatTheDate(task.createdAt)} 
                            </h5>
                             <textarea id="textarea-${task._id}" readonly class="display-none">${task.name}</textarea>
                             <p class="font-size-14 main-color" id="paragraph-${task._id}">${task.name}</p>
                            </div>
                        <div class="actions-wrapper">
                        <!-- Completed checkbox -->
                        <div>
                        <input type="checkbox" class="opacity-0" disabled id="checkbox-${task._id}" ${task.completed && `checked`}>
                        <!-- Origin task status -->
                        <input type="checkbox" class="opacity-0 origin-status" disabled id="task-status-origin-${task._id}" ${task.completed && `checked`}/>
                        </div>
                        <!-- Undo edit -->
                        <div class="action-btn display-none cursor-pointer undo-editing" id="undo-editing-${task._id}">
                        <i class="fa fa-ban warning-color" aria-hidden="true"></i>
                        </div>
                        <!-- Activate edit -->
                        <div data-id="${task._id}" id="edit-btn-${task._id}" class="edit-action action-btn cursor-pointer">
                           <i class="fas fa-edit" id="edit-icon-${task._id}"></i>
                        </div>
                        <!-- Delete -->
                        <div class="action-btn cursor-pointer delete-action" data-id="${task._id}">
                            <i class="fa fa-trash" aria-hidden="true"></i>
                        </div>
                        </div>
                        </div>`

            }).join('')

    }).catch(
        err => {
            showMessage('Failed to display list', 'warning-color')
            console.log(err);
        }
    )
    loadingDOM.style.visibility = 'hidden'
}

showTasks()

tasksDOM.addEventListener('click', async (e) => {

    const el = e.target
    loadingDOM.style.visibility = 'visible'
    const id = el.parentElement.dataset.id

    /** DELETE TASK **/
    if (el.parentElement.classList.contains('delete-action')) {
        try {
            await axios.delete(`/api/v1/tasks/${id}`)
           const singleTask = document.getElementById(id)
            singleTask.remove()
        } catch (error) {
            showMessage('Failed to delete task', 'warning-color')
            console.log(error)
        }
    }

    /** EDIT TASK **/
    if (el.parentElement.classList.contains('edit-action')) {
        let textarea = document.getElementById('textarea-'+id)
        let checkbox = document.getElementById('checkbox-'+id)
        let undoEditing = document.getElementById('undo-editing-'+id)
        let paragraph = document.getElementById('paragraph-'+id)
        paragraph.classList.add('display-none')
        // Submit an edit request
        if(el.classList.contains('active-edit-color')) {
            if (validate(textarea.value)) {
                await axios.patch('/api/v1/tasks/' + id, {
                    name: textarea.value,
                    completed: checkbox.checked
                }).then(function (response) {
                    turnOffEditing(textarea, el, undoEditing, checkbox, paragraph, false, false)
                    showTasks()
                    console.log(response)
                }).catch(function (error) {
                    checkError(error)
                });
            }
        }else{
            // We are looking for an included task for editing
            let previousElement = document.getElementsByClassName('active-edit-color');
            // If found, disable it.
            if(previousElement[0] && String(previousElement[0].id) !== String(el.id)){
                const previousTaskId = previousElement[0].id.slice('edit-icon-'.length);
                let previousCheckbox = document.getElementById('checkbox-'+previousTaskId);
                let previousUndoIcon = document.getElementById('undo-editing-'+previousTaskId);
                let previousTextArea = document.getElementById('textarea-'+previousTaskId)
                let paragraph = document.getElementById('paragraph-'+previousTaskId)
                let originPrevTaskStatus = document.getElementById('task-status-origin-'+previousTaskId)
                disabledPreviousTaskEditing()
                turnOffEditing(previousTextArea, previousElement[0], previousUndoIcon, previousCheckbox, paragraph, true, originPrevTaskStatus)
            }
            activateEditing(el, textarea, checkbox, undoEditing)
        }
    }

    /** UNDO EDITING **/
    if(el.parentElement.classList.contains('undo-editing')){
        let idUndo = el.parentElement.id;
        const taskId = idUndo.slice('undo-editing-'.length);
        let checkbox = document.getElementById('checkbox-'+taskId)
        let textarea = document.getElementById('textarea-'+taskId)
        let editIcon = document.getElementById('edit-icon-'+taskId)
        let paragraph = document.getElementById('paragraph-'+taskId)
        let originTaskStatus = document.getElementById('task-status-origin-'+taskId)
        turnOffEditing(textarea, editIcon, el.parentElement, checkbox, paragraph, true, originTaskStatus)
    }

    loadingDOM.style.visibility = 'hidden'
})

/** CREATE TASK **/
formDOM.addEventListener('submit', async (e) => {
    e.preventDefault()
    const name = createTaskInputDOM .value

    if(validate(name)){
        await axios.post('/api/v1/tasks', {
            name: name,
        }).then(function (response) {
                showTasks()
                createTaskInputDOM.value = ''
                showMessage(`Success, task added`, 'completed-color')
                console.log(response)
            }).catch(function (error) {
                checkError(error)
            });
    }

    setTimeout(() => {
        formAlertDOM.style.opacity = '0';
        formAlertDOM.classList.remove('warning-color')
        formAlertDOM.classList.remove('completed-color')
    }, 3000)
})