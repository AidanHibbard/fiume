# Fiume

A JavaScript module heavily inspired by [light-service](https://github.com/adomokos/light-service).

## Background

After working with light-service for a while, some personal projects began to feel like they could use code splitting. The current [JavaScript implementation of light-service](https://github.com/douglasgreyling/light-service.js) has been sitting for a decent amount of time now, seemed like a good challenge to rebuild it, and tweak some things. 

## Usage

Install the package in your project

```bash
npm i @aidanhibbard/fiume
```

### Classes

Fiume exports three classes

- Action
- Context
- Service

#### Action

The Action class is the base class for all actions that can be executed by a service. 

It has a constructor that initializes its expects and promises properties, which are arrays of strings representing the keys that the action expects to find in the context data and the promises that it will set, respectively. 

It has methods to validate its expectations, to check if it returns any promises or expects, to execute the action, and to run the action. 

The run method is the main method of the Action class and calls the checkEmptyPromiseOrExpects, validateExpectations, and execute methods in order. 

If any of these methods fails, it throws an error. Otherwise, it sets the promises of the action in the context and returns nothing.

#### Context

The Context class is responsible for managing the context data for an action or a service. 

It receives an optional data object that initializes the context data. 

The getLastPromise method returns the last promise key added to the context, and the waitAllPromises method returns a promise that resolves when all promises in the context are settled. 

The addPromise method adds a promise key to the context, and the hasPromise method returns true if the context has a promise with the given key. 

The set, get, has, fail, finish, and isFinished methods respectively set a key-value pair in the context data, get a value by key from the context data, check if the context has a key, fail the context with an error message, finish the context with a result, and check if the context is finished.

#### Service

The Service class is responsible for orchestrating the execution of a list of actions, in a given context. 

It has a static execute method that receives the list of actions to be executed and returns a new instance of the Service class, initialized with the given actions. 

The constructor of the Service class initializes its properties, including the list of actions, and sets the service as pending and error-free. 

The with method is the main method of the Service class and receives a context object. 

It creates a new instance of the Context class, iterates over the list of actions, and calls the run method of each action. 

If any action fails or the context is failed, the service sets itself as failed and returns the error message. 

Otherwise, the service sets itself as not pending, sets the result of the last action in the list, and returns a service result object with the context data, the status of the service (pending, error, or not pending), the error message, and the result of the service.

#### Getting started

```javascript
// action_one.js
import { Action } from 'fiume';
export default class ActionOne extends Action {
    expect() {
        return ['firstname', 'lastname'];
    };
    promise() {
        return ['fullname'];
    };
    async execute() {
        // You can also use this.ctx.get('key');
        const { firstname, lastname } = this.ctx.data;
        this.ctx.set('fullname', `${firstname} ${lastname}`);
    };
};
```

```javascript
// action_two.js
import { Action } from 'fiume';
export default class ActionTwo extends Action {
    expect() {
        return ['fullname'];
    };
    promise() {
        return ['hello'];
    };
    async execute() {
        const { fullname } = this.ctx.data;
        this.ctx.set('hello', `Hello, ${fullname}`);
    };
};
```

Import the Service, and Context classes into your code

```javascript
// index.js
import ActionOne from './action_one.js';
import ActionTwo from './action_two.js';
import { Service, Context } from 'fiume';

const actions = [
    ActionOne,
    ActionTwo
];
const ctx = new Context({ 
    firstname: "John",
    lastname: "Smith"
});
const resulting_ctx = await Service.execute(actions).with(ctx);
console.log(resulting_ctx);
/*
{
    data: {
        fname: 'John',
        lname: 'Smith',
        fullname: 'John Smith',
        hello: 'Hello, John Smith!'
    },
    pending: false,
    error: false,
    result: { hello: 'Hello, John Smith!' }
}
*/
```

#### Error handling

The Context class can set the failed flag to true if an error occurs, and then throw an error if any further attempt is made to modify the context data.

The Action class checks if it returns any promises or expects any data, and throws an error if either of those are empty.

The Service class has a try-catch-finally block, which catches any errors that may occur during execution and sets the error property of the service result object. If an error occurs, the pending state is set to false. 

If the error is caught in the try-catch-finally block, then the service class will attempt to produce a message, with the action name, error message, and stack.

The Service class sets the pending flag to false in the finally block, regardless of whether an error occurred or not.

#### A user may encounter different types of errors depending on the specific case:

missing expected keys: If the validateExpectations method in the Action class is called and there are missing expected keys in the context data, an error is thrown with this message.

did not return any: If the checkEmptyPromiseOrExpects method in the Action class is called and either the expects or promises array is empty, an error is thrown with this message.

Context has been failed: If the waitAllPromises method of the Context class is called after the failed flag has been set to true, an error is thrown with this message.

...Skipped 1 messages: If an error occurs during execution of an action, this message may be appended to the error message. The exact error message will depend on the specific error that occurred.











