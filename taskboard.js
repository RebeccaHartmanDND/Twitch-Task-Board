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
        "`!check`",
        "`!clear`"
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
        updateTaskBoard(); // Update task board and manage scroll
    }
    

    else if (command === "!remove" && args.length === 1) {
        let index = parseInt(args[0]) - 1;
        if (tasks[username] && tasks[username][index]) {
            tasks[username].splice(index, 1);
            client.say(channel, `@${username}, removed task #${index + 1}`);
            saveTasks();
            updateTaskBoard(); // Update task board and manage scroll
        }
    }
    
    else if (command === "!done") {
        let index = args.length === 1 ? parseInt(args[0]) - 1 : -1;
    
        if (tasks[username]) {
            if (index >= 0 && tasks[username][index]) {
                // Mark the specified task as finished
                const taskName = tasks[username][index].text;
                tasks[username][index].finished = true;
                tasks[username][index].current = false;  // Remove current status when marking done
                client.say(channel, `@${username}, marked task: "${taskName}" as finished.`);
            } else {
                let foundUnfinishedTask = false;
                for (let i = 0; i < tasks[username].length; i++) {
                    if (!tasks[username][i].finished) {
                        const taskName = tasks[username][i].text;
                        tasks[username][i].finished = true;
                        tasks[username][i].current = false;  // Remove current status when marking done
                        client.say(channel, `@${username}, marked your first unfinished task: "${taskName}" as finished.`);
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
            updateTaskBoard(); // Update task board and manage scroll
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
else if (command === "!clear" && args.length === 0) {
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
        updateTaskBoard(); // Update task board and manage scroll
    } else {
        client.say(channel, `@${username}, you have no tasks.`);
    }
}

else if (command === "!clearalldone" && args.length === 0) {
    if (tags.mod || tags.badges?.broadcaster) { // Check if user is mod or broadcaster
        let tasksCleared = false;

        // Loop through all users and remove finished tasks
        for (let user in tasks) {
            if (tasks[user]) {
                let initialTaskCount = tasks[user].length;

                // Remove finished tasks
                tasks[user] = tasks[user].filter(task => !task.finished);

                // Check if tasks were actually removed
                if (tasks[user].length < initialTaskCount) {
                    tasksCleared = true;
                }

                // Remove user from tasks if they have no remaining tasks
                if (tasks[user].length === 0) {
                    delete tasks[user];
                }
            }
        }

        // Notify once instead of spamming chat
        if (tasksCleared) {
            client.say(channel, `@${tags.username}, all finished tasks have been cleared!`);
        } else {
            client.say(channel, `No finished tasks were found to clear.`);
        }

        saveTasks(); // Save updated tasks
        updateTaskBoard(); // Update task board
    } else {
        client.say(channel, `@${tags.username}, you don't have permission to use this command.`);
    }
}





else if (command === "!tbhelp") {
    client.say(channel, `User Commands:
    \`!add {task}\` - Add a new task. |
    \`!remove {index}\` - Remove a task by its number. |
    \`!done {index}\` - Mark a task as done. |
    \`!edit {index} {task}\` - Edit a task's name. |
    \`!check\` - Check your tasks. |
    \`!clear\` - Remove all finished tasks for you.`);
}


else if (command === "!tbhelpmod") {
    client.say(channel, `Moderator & Streamer Commands:
    \`!clearalldone\` - Remove all finished tasks for everyone. |
    \`!clearalltasks\` - Clear all tasks for everyone. |
    \`!cleartasksuser {username}\` - Clear all tasks for a specific user. |
    \`!removeusertask {username} {index}\` - Remove a specific task from a user.`);
}




else if (["!clearalltasks", "!cleartasksuser", "!removeusertask"].includes(command)) {
    if (tags.mod || tags.badges?.broadcaster) { // Check if user is mod or broadcaster
        if (command === "!clearalltasks") {
            tasks = {}; // Clear all tasks for everyone
            client.say(channel, `All tasks cleared.`);
        } else if (command === "!cleartasksuser" && args.length === 1) {
            let userToClear = args[0].toLowerCase();
            if (tasks[userToClear]) {
                delete tasks[userToClear]; // Clear all tasks for the specified user
                client.say(channel, `Cleared all tasks for @${userToClear}.`);
            } else {
                client.say(channel, `@${userToClear} has no tasks to clear.`);
            }
        } else if (command === "!removeusertask" && args.length === 2) {
            let userToEdit = args[0].toLowerCase();
            let index = parseInt(args[1]) - 1;
            if (tasks[userToEdit] && tasks[userToEdit][index]) {
                tasks[userToEdit].splice(index, 1); // Remove task from the user's list
                client.say(channel, `Removed task #${index + 1} for @${userToEdit}.`);
            } else {
                client.say(channel, `@${username}, no task found at that index for @${userToEdit}.`);
            }
        }
        saveTasks(); // Save changes after clearing or removing tasks
        updateTaskBoard(); // Ensure the task board is updated after changes
    } else {
        client.say(channel, `@${username}, you don't have permission to use this command.`);
    }
}


else if (command === "!edit" && args.length > 1) {
    // Check if tasks exist for the user
    if (!tasks[username]) {
        client.say(channel, `@${username}, you have no tasks to edit.`);
        return;
    }

    let index = parseInt(args[0]) - 1; // Index of the task to edit
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
        updateTaskBoard(); // Update task board after editing
    } else {
        client.say(channel, `@${username}, no valid task found to edit.`);
    }
} else if (command === "!edit" && args.length <= 1) {
    client.say(channel, `@${username}, please provide a task index and the new task text. Example: !edit {task index} {new task text}`);
}


else if (command === "!check") {
    if (tasks[username] && tasks[username].length > 0) {
        const userTasks = tasks[username]
            .filter(task => !task.finished) // Only show unfinished tasks
            .map((task, index) => `#${index + 1}: ${task.text} |`)
            .join("\n");

        if (userTasks.length > 0) {
            client.say(channel, `@${username}, here are your unfinished tasks:\n${userTasks}`);
        } else {
            client.say(channel, `@${username}, you have no unfinished tasks.`);
        }
    } else {
        client.say(channel, `@${username}, you have no tasks.`);
    }
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

    // Reset the scroll position to top when updating task board content
    taskBoard.scrollTop = 0;  // This ensures it starts from the top initially

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

    // Update completed tasks counter
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

    // Check if auto scroll interval is already set, do nothing if it is
    if (autoScrollInterval) {
        return; // Prevent setting a new interval if one is already active
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

    // Set interval with a fixed speed to prevent speeding up
    autoScrollInterval = setInterval(scroll, 100); // Adjust speed as needed
}
