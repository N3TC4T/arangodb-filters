const OPERATORS = {
    eq: '==',
    neq: '!=',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    and: 'AND',
    or: 'OR',
    like: 'LIKE',
    nlike: 'NOT LIKE',
    inq: 'IN',
    nin: 'NOT IN',
};

const OPERATIONS = {
    limit: 'LIMIT',
    sort: 'SORT',
    filter: 'FILTER',
    in: 'IN',
};

export { OPERATORS, OPERATIONS };
