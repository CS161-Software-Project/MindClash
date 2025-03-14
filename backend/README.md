# Backend

This folder contains the backend logic for **MindClash: Battle of Wits**, built using **Python (Flask)** and **Socket.IO** for real-time communication.

### **Features**
- Handles player authentication and account management.
- Manages game logic, including questions, challenges, and power-ups.
- Enables real-time communication between players using Socket.IO.
- Stores game data and player progress in a database.

Commands to setup Django project

install virtual environment
$ python install virtualenv

set up venv
$ python -m venv venv

Activate venv
$ venv\scripts\activate

Create a project
$ django-admin startproject project-name

to run the project
$ python manage.py runserver

To create apps inside project
$ python manage.py startapp app-name

To execute SQL commands
$ python manage.py migrate

