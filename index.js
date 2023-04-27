export class Service {
    static execute(actions) {
        return new Service(actions);
    };
    constructor(actions) {
        this.actions = actions;
        this.pending = true;
        this.error = false;
        this.result = null;
    };
    async with(ctx) {
        let context = null;
        let serviceResult = null;
        let currentActionIndex = 0;
    
        try {
            context = new Context(ctx.data);
            for (const ActionClass of this.actions) {
                const action = new ActionClass();
                action.ctx = context;
                this.currentActionIndex = currentActionIndex;
                await action.run();
                currentActionIndex++;
        
                if (context.failed) {
                    this.error = context.error;
                    this.pending = false;
                    break;
                };
                if (context.isFinished()) {
                    this.result = context.result;
                    this.pending = false;
                    break;
                };
            };
            if (!this.result) {
                const lastPromiseKey = context.getLastPromise();
                if (lastPromiseKey) {
                    const allPromises = await context.waitAllPromises();
                    const missingKeys = [];
                    for (let i = 0; i < allPromises.length; i++) {
                        if (allPromises[i].status === "rejected") {
                            this.error = allPromises[i].reason;
                            this.pending = false;
                            break;
                        };
                        if (allPromises[i].value === undefined) {
                            missingKeys.push(context.promises[i]);
                        };
                    };
                    if (missingKeys.length === 0) {
                        const promises = (new this.actions[this.currentActionIndex])['promises'];
                        const result = {};
                        for (const promise of promises) {
                            result[promise] = context.data[promise];
                        };
                        this.result = result;
                    } else {
                        this.error = `${this.actions[this.currentActionIndex].name} has keys missing from the context: ${missingKeys.join(", ")}`;
                    };
                } else {
                    this.result = context.data;
                };
            };
                serviceResult = {
                data: context.data,
                pending: this.pending,
                error: this.error,
                result: this.result,
            };
        } catch (e) {
            const actionName = this.actions[currentActionIndex]?.name || '';
            const errorMessage = e?.message || '';
            const errorStack = e?.stack || '';
            const actionMessage = `${actionName} ${errorMessage}`;
            const error = `${actionMessage}\n\n${errorStack}`;
            this.error = error;
        } finally {
            this.pending = false;
            serviceResult = {
            data: context.data,
            pending: this.pending,
            error: this.error,
            result: this.result,
            };
        };
        return serviceResult;
    };
};


export class Context {
    constructor(data = {}) {
        this.data = data;
        this.promises = [];
        this.failed = false;
    }
    getLastPromise() {
        return this.promises[this.promises.length - 1];
    }
    waitAllPromises() {
        return new Promise((resolve, reject) => {
            if (this.failed) {
                reject(new Error('Context has been failed'));
            } else {
                Promise.allSettled(this.promises.map((key) => this.data[key]))
                    .then((results) => resolve(results))
                    .catch(reject);
            };
        });
    };
    addPromise(key) {
        this.promises.push(key);
    };
    hasPromise(key) {
        return this.promises.includes(key);
    };
    set(key, value) {
        if (!this.failed) {

            this.data[key] = value;
        };
    };
    get(key) {
        return this.data[key];
    };
    has(key) {
        return this.data.hasOwnProperty(key);
    };
    fail(message) {
        this.failed = true;
        throw new Error(message);
    };
    finish(result) {
        this.success = true;
        this.finished = true;
        this.result = result;
    };
    isFinished() {
        return this.finished;
    };
};

export class Action {
    constructor() {
        this.expects = this.expect();
        this.promises = this.promise();
    };

    validateExpectations() {
        const missingKeys = this.expects.filter(key => !this.ctx.has(key));
        if (missingKeys.length > 0) {
            throw new Error(`missing expected keys: ${missingKeys.join(", ")}`);
        };
    };
    
    checkEmptyPromiseOrExpects() {
        const { promises, expects } = this;
        const missingItems = [];

        if (!promises || promises.length === 0) {
            missingItems.push("promises");
        };

        if (!expects || expects.length === 0) {
            missingItems.push("expects");
        };

        if (missingItems.length > 0) {
            throw new Error(`did not return any: ${missingItems.join(", ")}`);
        };
    };

    async execute() {
        // Do something with the context data
        this.validateExpectations();

        // Update context data, set promises, etc.
    };
    
    async run() {
        this.checkEmptyPromiseOrExpects();
        this.validateExpectations();
        const snapshot = Object.keys(this.ctx.data);
        await this.execute();
        this.expects = this.expect();
        this.promises = this.promise();
        this.promises.forEach((key) => this.ctx.addPromise(key));
        const extraKeys = Object.keys(this.ctx.data).filter((key) => !this.promises.includes(key) && !snapshot.includes(key));
        if (extraKeys.length > 0) {
            throw new Error(`set unpromised keys: ${JSON.stringify((extraKeys))}`);
        };
    };

    expect() {};

    promise() {};
};
