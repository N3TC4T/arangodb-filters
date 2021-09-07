import { OPERATIONS, OPERATORS } from './constants';

export class ArangoFilter {
    private filter: any;
    private varName: string;

    constructor(f?: any) {
        this.filter = f ?? {};
        this.varName = 'doc';
    }

    validate = () => {
        const { limit, offset, order } = this.filter;

        // validate the inputs
        if (limit) {
            if (typeof limit !== 'number' || limit < 0) {
                throw new Error('limit should be a positive number');
            }
        }
        if (offset) {
            if (typeof offset !== 'number' || offset < 0) {
                throw new Error('offset should be a positive number');
            }
        }
        if (order) {
            if (!Array.isArray(order)) {
                throw new Error('order should be a type of array');
            }
            for (const o of order) {
                if (typeof o !== 'string' || !o.match(/^[^\s]+( (ASC|DESC))?$/)) {
                    throw new Error('order fields need to be string and correct format');
                }
            }
        }
    };

    getFieldName = (field: string): any => {
        const props = field.split('.');
        let value = this.varName;
        for (const p of props) {
            value += `.\`${p}\``;
        }
        return value;
    };

    getOperator = (operator: string): string => {
        // @ts-ignore
        if (OPERATORS[operator] !== undefined) return OPERATORS[operator];
        else return '==';
    };

    processCondition = (condition: any, operator = '=='): any => {
        switch (typeof condition) {
            case 'string':
                return `${operator} '${condition}'`;
            case 'boolean':
                return `${operator} ${condition ? 'true' : 'false'}`;
            case 'number':
                return `${operator} ${condition}`;
            case 'object':
                if (Array.isArray(condition)) {
                    if (['or', 'and'].includes(operator)) {
                        let no = '(';
                        let counter = 0;
                        for (const c of condition) {
                            for (const [key, value] of Object.entries(c)) {
                                no += this.processFilter(key, value);
                                if (++counter !== condition.length) {
                                    no += ` ${this.getOperator(operator)} `;
                                }
                            }
                        }
                        no += ')';
                        return no;
                    } else {
                        return `${OPERATIONS.in} [${condition.map((c) => `'${c}'`).join(',')}]`;
                    }
                } else {
                    let no = '';
                    for (const [key, value] of Object.entries(condition)) {
                        no += this.processCondition(value, this.getOperator(key));
                    }
                    return no;
                }
            default:
                console.log(typeof condition);
                return 'test';
        }
    };

    processFilter = (field: any, condition: any) => {
        const normalizedField = this.getFieldName(field);
        const normalizedCondition = this.processCondition(condition);

        return `${normalizedField} ${normalizedCondition}`;
    };

    handleLimit = (query = '') => {
        // limit and offset
        const { limit, offset } = this.filter;

        if (limit) {
            if (typeof offset === 'number') {
                query += `${OPERATIONS.limit} ${offset}, ${limit}`;
            } else {
                query += `${OPERATIONS.limit} ${limit}`;
            }
            query += `\n`;
        }
        return query;
    };

    handleOrder = (query = '') => {
        // order
        const { order } = this.filter;

        if (!order || order.length === 0) {
            return query;
        }

        query += `${OPERATIONS.sort} `;
        let counter = 0;
        for (const o of order) {
            if (!o.endsWith(' ASC') && !o.endsWith(' DESC')) {
                query += `${this.getFieldName(o)} ASC`;
            } else {
                const field = o.split(' ')[0];
                const opt = o.split(' ')[1];
                query += `${this.getFieldName(field)} ${opt}`;
            }

            if (++counter !== order.length) {
                query += ', ';
            }
        }
        query += `\n`;
        return query;
    };

    handleFilters = (query = '') => {
        // filters
        const { where } = this.filter;
        if (Array.isArray(where) && where.length > 0) {
            query += `${OPERATIONS.filter} `;
            let counter = 0;
            for (const c of where) {
                for (const [key, value] of Object.entries(c)) {
                    if (['or', 'and', 'like', 'nlike'].includes(key)) {
                        query += this.processCondition(value, key);
                    } else {
                        query += this.processFilter(key, value);
                    }

                    if (++counter !== where.length) {
                        query += ' && ';
                    }
                }
            }
        }
        return query;
    };

    toAql = (validate = true): string => {
        if (validate) {
            this.validate();
        }
        const query = [this.handleLimit, this.handleOrder, this.handleFilters].reduce((accumulator: any, callback) => {
            return callback(accumulator);
        }, '');
        return query;
    };
}
