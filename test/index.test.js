import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Service, Context, Action } from '../index.js';

class ActionOne extends Action {
    expect() {
        return ['fname', 'lname'];
    };
    promise() {
        return ['fullname'];
    };
    async execute() {
        const { fname, lname } = this.ctx.data;
        const fullname = `${ fname } ${ lname }`;
        this.ctx.set('fullname', fullname);
    };
};
class ActionTwo extends Action {
    expect() {
        return ['fullname'];
    };
    promise() {
        return ['hello'];
    };
    async execute() {
        const { fullname } = this.ctx.data;
        const hello = `Hello, ${fullname}!`;
        this.ctx.set('hello', hello);
    };
};
const actions = [
    ActionOne,
    ActionTwo
];
const ctx = new Context({ 
    fname: 'John',
    lname: 'Smith'  
});
const resulting_ctx = await Service.execute(actions).with(ctx);
console.log(resulting_ctx);