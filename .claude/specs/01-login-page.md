
## Overview

Create a Registration and Login Page for user


## To Create

1. Create a page for Registration
2. Create a page for Login


## Endpoints

1. POST /register
    full url: localhost:8000/register
    payload: name, email, password

    Response: {
                "id": 1,
                "name": "apple",
                "email": "apple@a.com",
                "created_at": "2026-05-23"
                }

2. POST /login
    full url: localhost:8000/login
    payload: email, password

    Response: {
                "id": 1,
                "name": "apple",
                "email": "apple@a.com",
                "created_at": "2026-05-23"
                }


## User Flow

1. User visits our website for first time, he sees login screen
2. If user is not registered, the page also has a button to register
3. user registers himself
4. post successfull registration, the page automatically redirects to login page
5. user logs in and finally is able to see the deep-chat home screen


## Rules for Implementation

1. Form validation before api call, must check if users has entered name, email and password in the registration form and also validate those 
2. Apply similar validation to Login form as well


## Error Handling and Exceptions:

1. Handle all the edge cases
2. Handle Errors and Exception wherever required in the code


## Definition of Done

1. User is able to register
2. post registration user is redirected to login page
3. user is able to login
4. post login user is redirected to home page of deep-chat app