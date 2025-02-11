const client = new tmi.Client({
    options: { debug: true },
    connection: {
        reconnect: true,
        secure: true,
    },
    identity: {
        username: 'BOT_Name_Here', // Replace with your bot's username
        password: 'oauth:BOT_OAUTH_Token_HERE', // Replace with your OAuth token
    },
    channels: ['Your_Username_Here'], // Replace with your channel name
});


client.connect().catch(console.error);

let tasks = {};

// Load tasks from localStorage on page load
window.onload = function () {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    updateTaskBoard();
};

    // Array of command descriptions
    const commands = [
        "`!add {task}`",
        "`!remove {index}`",
        "`!done {index}`",
        "`!edit {index} {task}`",
        "`!removedone`"
    ];
    
    let currentCommandIndex = 0;
    let commandInterval;
    
    function cycleCommands() {
        const currentCommandElement = document.getElementById("currentCommand");
    
        // Display the current command in the element
        currentCommandElement.textContent = commands[currentCommandIndex];
    
        // Update the index to cycle through the commands
        currentCommandIndex = (currentCommandIndex + 1) % commands.length;
    }
    
    // Start cycling through the commands
    function startCyclingCommands() {
        if (commandInterval) clearInterval(commandInterval); // Prevent multiple intervals
        commandInterval = setInterval(cycleCommands, 5000); // Update every 5 seconds
    }
    
    // Start cycling when the page loads
    window.onload = function() {
        startCyclingCommands();
    };

client.on("message", (channel, tags, message, self) => {
    if (self) return;
    const args = message.split(" ");
    const command = args.shift().toLowerCase();
    const username = tags.username;

    if (command === "!add" && args.length > 0) {
        let newTasks = message.replace("!add ", "").split(",").map(task => task.trim()).slice(0, 15);
        if (!tasks[username]) tasks[username] = [];
        newTasks.forEach(task => tasks[username].push({ text: task, finished: false }));
        client.say(channel, `@${username}, added tasks: ${newTasks.join(", ")}`);
        saveTasks();
        updateTaskBoard();
    }

    else if (command === "!remove" && args.length === 1) {
        let index = parseInt(args[0]) - 1;
        if (tasks[username] && tasks[username][index]) {
            tasks[username].splice(index, 1);
            client.say(channel, `@${username}, removed task #${index + 1}`);
            saveTasks();
            updateTaskBoard();
        }
    }
    else if (command === "!done") {
        let index = args.length === 1 ? parseInt(args[0]) - 1 : -1; 
    
        if (tasks[username]) {
            if (index >= 0 && tasks[username][index]) {
                tasks[username][index].finished = true;
                tasks[username][index].current = false;  // Remove current status when marking done
                client.say(channel, `@${username}, marked task #${index + 1} as finished.`);
            } else {
                let foundUnfinishedTask = false;
                for (let i = 0; i < tasks[username].length; i++) {
                    if (!tasks[username][i].finished) {
                        tasks[username][i].finished = true;
                        tasks[username][i].current = false;  // Remove current status when marking done
                        client.say(channel, `@${username}, marked your first unfinished task (#${i + 1}) as finished.`);
                        foundUnfinishedTask = true;
                        break;
                    }
                }

                if (!foundUnfinishedTask) {
                    client.say(channel, `@${username}, all your tasks are already finished!`);
                }
            }

            // After marking a task as done, set the first unfinished task as the current one
            const nextTask = tasks[username].find(task => !task.finished);
            if (nextTask) {
                nextTask.current = true;
            }

            saveTasks();
            updateTaskBoard();
        } else {
            client.say(channel, `@${username}, you have no tasks to mark as finished.`);
        }
    }

    // !start command
    else if (command === "!start" && args.length === 1) {
        let index = parseInt(args[0]) - 1;
        if (tasks[username] && tasks[username][index] && !tasks[username][index].finished) {
            // Remove current status from any other task
            tasks[username].forEach(task => task.current = false);

            // Set the selected task as the current task
            tasks[username][index].current = true;
            client.say(channel, `@${username}, started working on task #${index + 1}: ${tasks[username][index].text}`);
            saveTasks();
            updateTaskBoard();
        } else {
            client.say(channel, `@${username}, invalid task number or task is already finished.`);
        }
    }

// !removedone command (user-specific) - Remove all finished tasks
else if (command === "!removedone" && args.length === 0) {
    if (tasks[username]) {
        // Filter out finished tasks
        const initialTaskCount = tasks[username].length;
        tasks[username] = tasks[username].filter(task => !task.finished);

        // Check if any tasks were removed
        if (tasks[username].length < initialTaskCount) {
            client.say(channel, `@${username}, removed all finished tasks.`);
        } else {
            client.say(channel, `@${username}, you have no finished tasks to remove.`);
        }

        saveTasks();
        updateTaskBoard();
    } else {
        client.say(channel, `@${username}, you have no tasks.`);
    }
}


    // !removedoneall command (mod/streamer only)
    else if (command === "!removedoneall" && args.length === 1) {
        if (tags.mod || channel.replace("#", "") === username) {
            let userToClear = args[0].toLowerCase();
            if (tasks[userToClear]) {
                tasks[userToClear].forEach(task => {
                    task.finished = false; // Reset all tasks to unfinished
                });
                client.say(channel, `@${userToClear}, all tasks are now marked as unfinished.`);
                saveTasks();
                updateTaskBoard();
            } else {
                client.say(channel, `@${username}, no tasks found for @${userToClear}.`);
            }
        } else {
            client.say(channel, `@${username}, you don't have permission to use this command.`);
        }
    }

    else if (command === "!tbhelp") {
        client.say(channel, `User Commands:
        \`!add {task}\` - Add a new task. |
        \`!remove {index}\` - Remove a task by its number. |
        \`!done {index}\` - Mark a task as done. |
        \`!start {index}\` - Start working on a specific task. |
        \`!edit {index} {new task name}\` - Edit a task's name. |
        \`!removedone\` - Remove all finished tasks for you. |`);
    }
    
    else if (command === "!tbhelpmod") {
        client.say(channel, `Moderator & Streamer Commands:
        \`!removedoneall {username}\` - Remove all finished tasks for a user. |
        \`!clearalltasks\` - Clear all tasks for everyone. |
        \`!cleartasksuser {username}\` - Clear all tasks for a specific user. |
        \`!removeusertask {username} {index}\` - Remove a specific task from a user.`);
    }
    


    

    else if (["!clearalltasks", "!cleartasksuser", "!removeusertask"].includes(command)) {
        if (tags.mod || channel.replace("#", "") === username) {
            if (command === "!clearalltasks") {
                tasks = {};
                client.say(channel, `All tasks cleared.`);
            } else if (command === "!cleartasksuser" && args.length === 1) {
                let userToClear = args[0].toLowerCase();
                delete tasks[userToClear];
                client.say(channel, `Cleared all tasks for @${userToClear}.`);
            } else if (command === "!removeusertask" && args.length === 2) {
                let userToEdit = args[0].toLowerCase();
                let index = parseInt(args[1]) - 1;
                if (tasks[userToEdit] && tasks[userToEdit][index]) {
                    tasks[userToEdit].splice(index, 1);
                    client.say(channel, `Removed task #${index + 1} for @${userToEdit}.`);
                }
            }
            saveTasks();
            updateTaskBoard();
        } else {
            client.say(channel, `@${username}, you don't have permission to use this command.`);
        }
    }


// Inside the message listener for '!edit' command
else if (command === "!edit" && args.length > 1) {
    // Check if tasks exist for the user
    if (!tasks[username]) {
        client.say(channel, `@${username}, you have no tasks to edit.`);
        return;
    }

    let index = parseInt(args[0]) - 1; // Index of the task to edit (optional)
    let newTaskText = args.slice(1).join(" "); // The new task text

    // Check if no valid index is provided, find the first non-finished task
    if (isNaN(index) || index < 0 || !tasks[username][index]) {
        index = tasks[username].findIndex(task => !task.finished); // Default to the first non-finished task
    }

    // If index is valid, update the task text
    if (index >= 0 && tasks[username] && tasks[username][index]) {
        tasks[username][index].text = newTaskText; // Update the task's text
        client.say(channel, `@${username}, edited task #${index + 1} to: ${newTaskText}`);
        saveTasks();
        updateTaskBoard();
    } else {
        client.say(channel, `@${username}, no valid task found to edit.`);
    }
} else if (command === "!edit" && args.length <= 1) {
    client.say(channel, `@${username}, please provide a task index and the new task text. Example: !edit {task index} {new task text}`);
}


});


// Function to save tasks to localStorage
function saveTasks() {
    console.log("Saving tasks to localStorage:", tasks);  // Debug log
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Load tasks from localStorage on page load
window.onload = function () {
    // Debug: Check if tasks exist in localStorage
    const savedTasks = localStorage.getItem("tasks");
    console.log("Loaded tasks from localStorage:", savedTasks);  // Debug log
    
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        console.log("Parsed tasks:", tasks);  // Debug log
    }

    // Update the task board if tasks exist
    updateTaskBoard();
    
    // Start cycling through the commands
    startCyclingCommands();
};


let autoScrollInterval; // Store interval reference



function updateTaskBoard() {
    const taskBoard = document.getElementById("taskBoard");
    const completedCounter = document.getElementById("completedTasks");

    // Store the current scroll position before updating
    let scrollPosition = taskBoard.scrollTop;
    let atBottom = taskBoard.scrollTop + taskBoard.clientHeight >= taskBoard.scrollHeight;

    // Clear the existing task board content
    taskBoard.innerHTML = "";

    let totalCompleted = 0;
    let totalTasks = 0;  // Track the total number of tasks

    // Loop through tasks and add them
    for (let user in tasks) {
        let userSection = document.createElement("div");
        userSection.classList.add("user-section");
        let userTitle = document.createElement("h3");
        userTitle.innerText = user;
        userSection.appendChild(userTitle);

        tasks[user].forEach((task, index) => {
            let taskItem = document.createElement("div");
            taskItem.classList.add("task-item");

            // Apply "current-task" class to the task the user is working on
            if (task.current) {
                taskItem.classList.add("current-task");
            }

            // Apply "finished-task" class to finished tasks
            if (task.finished) {
                taskItem.classList.add("finished-task");
                totalCompleted++; // Count finished tasks
            }

            taskItem.innerText = `${index + 1}. ${task.text}`;
            userSection.appendChild(taskItem);

            totalTasks++;  // Count all tasks (both finished and unfinished)
        });

        taskBoard.appendChild(userSection);
    }

    completedCounter.innerHTML = `Completed Tasks:<br>${totalCompleted}/${totalTasks}`;

    // Scroll to bottom if user was at bottom before update
    if (atBottom) {
        taskBoard.scrollTop = taskBoard.scrollHeight;
    } else {
        taskBoard.scrollTop = scrollPosition;
    }

    // Restart auto-scroll properly
    restartAutoScroll();
}





function restartAutoScroll() {
    const taskBoardContainer = document.getElementById("taskBoardContainer");

    // Clear any existing interval to prevent stacking multiple intervals
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
    }

    let scrollingDown = true;

    function scroll() {
        if (taskBoardContainer.scrollHeight <= taskBoardContainer.clientHeight) {
            clearInterval(autoScrollInterval);
            return;
        }

        if (scrollingDown) {
            taskBoardContainer.scrollTop += 1;
            if (taskBoardContainer.scrollTop + taskBoardContainer.clientHeight >= taskBoardContainer.scrollHeight) {
                scrollingDown = false;
                clearInterval(autoScrollInterval); // Stop scrolling
                setTimeout(() => {
                    autoScrollInterval = setInterval(scroll, 50); // Restart scrolling after delay
                }, 5000); // Wait 5 seconds before scrolling up
            }
        } else {
            taskBoardContainer.scrollTop -= 1;
            if (taskBoardContainer.scrollTop <= 0) {
                scrollingDown = true;
                clearInterval(autoScrollInterval); // Stop scrolling
                setTimeout(() => {
                    autoScrollInterval = setInterval(scroll, 50); // Restart scrolling after delay
                }, 5000); // Wait 5 seconds before scrolling down
            }
        }
    }

    autoScrollInterval = setInterval(scroll, 100); // Adjust speed as needed
}
