const { ArangoFilter } = require('../src');

const filter = {
    offset: 1,
    limit: 2,
    order: ['age DESC', 'money'],
    where: [
        { Account: 'r............' },
        { Fee: { gte: 1000 } },
        {
            or: [
                { TransactionType: ['Payment', 'Offer'] },
                {
                    Amount: {
                        nlike: 'USD%',
                    },
                },
            ],
        },
    ],
    options: ['details'],
};

describe('Filters', () => {
    const filters = new ArangoFilter(filter);

    it('should parse correctly', async () => {
        expect(filters.toAql()).toBe(
            "LIMIT 1, 2\nSORT doc.`age` DESC, doc.`money` ASC\nFILTER doc.`Account` == 'r............' && doc.`Fee` >= 1000 && (doc.`TransactionType` IN ['Payment','Offer'] OR doc.`Amount` NOT LIKE 'USD%')",
        );
    });
});
