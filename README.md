# Misery Task-Board

Welcome to **Misery Task-Board**, a browser-based task management tool designed to track and manage tasks via chat commands. Whether you're a streamer, moderator, or user, you can interact with the task board to add, remove, mark tasks as completed, and even edit your ongoing tasks!

## Features

- **Task Management**: Add, remove, and edit tasks with chat commands.
- **Task Progress**: Track your tasks, mark them as completed, and manage ongoing tasks.
- **Cycling Commands**: Displays chat commands every few seconds for easy reference.
- **User-Specific and Moderator Commands**: Users can manage their own tasks, while moderators can manage all users' tasks.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [User Commands](#user-commands)
  - [Moderator Commands](#moderator-commands)
- [Customization](#customization)
- [License](#license)

## Installation

### Prerequisites

Make sure you have the following:

- **Twitch Account**: For using the task board via your stream/chat.
- **OAuth Token**: Required to authenticate your bot on Twitch.

### Clone the Repository

To get started, clone this repository:

```bash
git clone https://github.com/your-username/misery-task-board.git
```

### Setup

1. **Edit JavaScript Configuration**:
   - Open the `taskboard.js` file.
   - Replace the following placeholders with your actual information:
     - `BOT_Name_Here` with your bot's username.
     - `BOT_OAUTH_Token_HERE` with your bot’s OAuth token (you can generate it [here](https://twitchapps.com/tmi/)).
     - `Your_Username_Here` with your Twitch username.

2. **Web Interface**:
   - Open the `index.html` file in a web browser.

The Task-Board will display on your page and be ready to interact with.

## Usage

Once the task board is set up, users can manage their tasks using Twitch chat commands. Here are the available commands for both users and moderators.

### User Commands

- `!add {task}`: Adds a new task. Example: `!add Do laundry, Buy groceries`.
- `!remove {index}`: Removes a task by its number. Example: `!remove 2`.
- `!done {index}`: Marks a task as completed. Example: `!done 1`.
- `!start {index}`: Starts working on a specific task. Example: `!start 1`.
- `!edit {index} {new task name}`: Edit a task. Example: `!edit 1 Take out trash`.
- `!removedone`: Removes all finished tasks.
- `!tbhelp`: Displays a list of user commands.

### Moderator Commands

Moderators have additional control over all users' tasks.

- `!removedoneall {username}`: Removes all finished tasks for a specific user.
- `!clearalltasks`: Clears all tasks for every user.
- `!cleartasksuser {username}`: Clears all tasks for a specific user.
- `!removeusertask {username} {index}`: Removes a specific task from another user.
- `!tbhelpmod`: Displays a list of moderator commands.

### Cycling Commands

The task board will cycle through available commands every 5 seconds for users to easily reference. This feature can be enabled or disabled by modifying the JavaScript configuration.

## Customization

You can customize the Task-Board’s look and feel by editing the `styles.css` file. This file controls the visual design, including:

- Task list styling.
- Background and font choices.
- Command display formatting.

### Fonts

This task board uses the **Press Start 2P** font from Google Fonts. You can change the font by editing the `font-family` property in `styles.css`.

### Task Board Display

The task board uses a flexible layout to display tasks for each user, with an area that auto-scrolls to keep the display clean.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for more details.
