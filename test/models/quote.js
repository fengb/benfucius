const { expect, _, db } = require('test/support')
const Quote = require('lib/models/quote')

describe('Quote', () => {
  describe('#fetchRandom', () => {
    db.sync()

    beforeEach(function * () {
      let quotes = _.times(10, () => new Quote())
      yield * _.map(quotes, (q) => q.save())
    })

    it('returns random quotes', function * () {
      let quotes = yield * _.times(3, () => Quote.forge().fetchRandom())
      let uniqQuoteIds = _(quotes)
                           .map((q) => q.get('id'))
                           .uniq()
                           .value()

      expect(uniqQuoteIds).to.not.have.length(1)
    })
  })

  describe('#withVotes', () => {
    db.sync()

    beforeEach(function * () {
      let quote = new Quote()
      this.quote = yield quote.save()
    })

    describe('#get("positive_votes")', () => {
      it('= 0 by default', function * () {
        let quote = yield Quote.forge().withVotes().fetch()
        expect(quote.get('positive_votes')).to.eq(0)
      })

      it('= 0.5 with votes', function * () {
        let votes = this.quote.related('votes')
        this.plusVote = yield votes.create({ value: '+' })
        this.minusVote = yield votes.create({ value: '-' })

        let quote = yield Quote.forge().withVotes().fetch()
        expect(quote.get('positive_votes')).to.eq(0.5)
      })
    })
  })

  describe('#kosher', () => {
    db.sync()

    beforeEach(function * () {
      let quote = new Quote()
      this.quote = yield quote.save()
    })

    it('is kosher by default', function * () {
      let quote = yield Quote.forge().kosher().fetch()
      expect(quote).to.not.be.null()
      expect(quote.get('id')).to.equal(this.quote.get('id'))
    })

    describe('with 50% "wtf" vote', function () {
      beforeEach(function * () {
        let votes = this.quote.related('votes')
        this.plusVote = yield votes.create({ value: '+' })
        this.wtfVote = yield votes.create({ value: 'wtf' })
      })

      it('is not kosher if over minCount and under threshold', function * () {
        let quote = yield Quote.forge().kosher({ minCount: 2, threshold: 1 }).fetch()
        expect(quote).to.be.null()
      })

      it('is kosher if under minCount', function * () {
        let quote = yield Quote.forge().kosher({ minCount: 3, threshold: 1 }).fetch()
        expect(quote).to.not.be.null()
      })

      it('is kosher if over threshold', function * () {
        let quote = yield Quote.forge().kosher({ minCount: 2, threshold: 0.4 }).fetch()
        expect(quote).to.not.be.null()
      })
    })
  })
})
