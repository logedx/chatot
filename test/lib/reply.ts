import * as chai from 'chai'
import * as sinon from 'sinon'

import * as reply from '../../src/lib/reply.js'



describe(
	'lib: reply.stdio',

	function ()
	{
		it(
			'should write some messages to console',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () =>
			{
				let id = Date.now().toString()

				let e = new Error('test')
				let x = new reply.Exception('test')


				let warn_stub = sinon.stub(console, 'warn')
				let error_stub = sinon.stub(console, 'error')
				let group_stub = sinon.stub(console, 'group')


				x.push('test', 'test')

				reply.stdio(id, e)
				reply.stdio(id, x)


				warn_stub.restore()
				error_stub.restore()
				group_stub.restore()

				sinon.assert.called(warn_stub)
				sinon.assert.called(error_stub)
				sinon.assert.called(group_stub)


			},

		)


	},

)


describe(
	'lib: reply.Exception',

	function ()
	{
		it(
			'should be a Error',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () =>
			{
				let e = new reply.Exception('test')

				chai.expect(e).instanceof(Error)
				chai.expect(e.data).be.an('array')
				// eslint-disable-next-line @typescript-eslint/unbound-method
				chai.expect(e.push).be.a('function')


			},

		)


	},

)


describe(
	'lib: reply.BadRequest',

	function ()
	{
		it(
			'should be a Error from Exception',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () =>
			{
				let e = new reply.BadRequest('test')

				chai.expect(e).instanceof(Error)
				chai.expect(e.name).equals('BadRequest')
				chai.expect(e.errno).equals(400)
				chai.expect(e.data).be.an('array')
				// eslint-disable-next-line @typescript-eslint/unbound-method
				chai.expect(e.push).be.a('function')


			},

		)


	},

)


describe(
	'lib: reply.Unauthorized',

	function ()
	{
		it(
			'should be a Error from Exception',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () =>
			{
				let e = new reply.Unauthorized('test')

				chai.expect(e).instanceof(Error)
				chai.expect(e.name).equals('Unauthorized')
				chai.expect(e.errno).equals(401)
				chai.expect(e.data).be.an('array')
				// eslint-disable-next-line @typescript-eslint/unbound-method
				chai.expect(e.push).be.a('function')


			},

		)


	},

)


describe(
	'lib: reply.Forbidden',

	function ()
	{
		it(
			'should be a Error from Exception',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () =>
			{
				let e = new reply.Forbidden('test')

				chai.expect(e).instanceof(Error)
				chai.expect(e.name).equals('Forbidden')
				chai.expect(e.errno).equals(403)
				chai.expect(e.data).be.an('array')
				// eslint-disable-next-line @typescript-eslint/unbound-method
				chai.expect(e.push).be.a('function')


			},

		)


	},

)


describe(
	'lib: reply.NotFound',

	function ()
	{
		it(
			'should be a Error from Exception',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () =>
			{
				let e = new reply.NotFound('test is not found')

				chai.expect(e).instanceof(Error)
				chai.expect(e.name).equals('NotFound')
				chai.expect(e.errno).equals(404)
				chai.expect(e.data).be.an('array')
				// eslint-disable-next-line @typescript-eslint/unbound-method
				chai.expect(e.push).be.a('function')


			},

		)


	},

)


describe(
	'lib: reply.MethodNotAllowed',

	function ()
	{
		it(
			'should be a Error from Exception',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () =>
			{
				let e = new reply.MethodNotAllowed('test')

				chai.expect(e).instanceof(Error)
				chai.expect(e.name).equals('MethodNotAllowed')
				chai.expect(e.errno).equals(405)
				chai.expect(e.data).be.an('array')
				// eslint-disable-next-line @typescript-eslint/unbound-method
				chai.expect(e.push).be.a('function')


			},

		)


	},

)


describe(
	'lib: reply.RequestTimeout',

	function ()
	{
		it(
			'should be a Error from Exception',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () =>
			{
				let e = new reply.RequestTimeout('test')

				chai.expect(e).instanceof(Error)
				chai.expect(e.name).equals('RequestTimeout')
				chai.expect(e.errno).equals(408)
				chai.expect(e.data).be.an('array')
				// eslint-disable-next-line @typescript-eslint/unbound-method
				chai.expect(e.push).be.a('function')


			},

		)


	},

)


describe(
	'lib: reply.Conflict',

	function ()
	{
		it(
			'should be a Error from Exception',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () =>
			{
				let e = new reply.Conflict('test')

				chai.expect(e).instanceof(Error)
				chai.expect(e.name).equals('Conflict')
				chai.expect(e.errno).equals(409)
				chai.expect(e.data).be.an('array')
				// eslint-disable-next-line @typescript-eslint/unbound-method
				chai.expect(e.push).be.a('function')


			},

		)


	},

)


describe(
	'lib: reply.Gone',

	function ()
	{
		it(
			'should be a Error from Exception',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () =>
			{
				let e = new reply.Gone('test')

				chai.expect(e).instanceof(Error)
				chai.expect(e.name).equals('Gone')
				chai.expect(e.errno).equals(410)
				chai.expect(e.data).be.an('array')
				// eslint-disable-next-line @typescript-eslint/unbound-method
				chai.expect(e.push).be.a('function')


			},

		)


	},

)


describe(
	'lib: reply.Lengthrequired',

	function ()
	{
		it(
			'should be a Error from Exception',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () =>
			{
				let e = new reply.Lengthrequired('test')

				chai.expect(e).instanceof(Error)
				chai.expect(e.name).equals('Lengthrequired')
				chai.expect(e.errno).equals(411)
				chai.expect(e.data).be.an('array')
				// eslint-disable-next-line @typescript-eslint/unbound-method
				chai.expect(e.push).be.a('function')


			},

		)


	},

)


describe(
	'lib: reply.PayloadTooLarge',

	function ()
	{
		it(
			'should be a Error from Exception',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () =>
			{
				let e = new reply.PayloadTooLarge('test')

				chai.expect(e).instanceof(Error)
				chai.expect(e.name).equals('PayloadTooLarge')
				chai.expect(e.errno).equals(413)
				chai.expect(e.data).be.an('array')
				// eslint-disable-next-line @typescript-eslint/unbound-method
				chai.expect(e.push).be.a('function')


			},

		)


	},

)


describe(
	'lib: reply.UnsupportedMediaType',

	function ()
	{
		it(
			'should be a Error from Exception',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () =>
			{
				let e = new reply.UnsupportedMediaType('test')

				chai.expect(e).instanceof(Error)
				chai.expect(e.name).equals('UnsupportedMediaType')
				chai.expect(e.errno).equals(415)
				chai.expect(e.data).be.an('array')
				// eslint-disable-next-line @typescript-eslint/unbound-method
				chai.expect(e.push).be.a('function')


			},

		)


	},

)


describe(
	'lib: reply.TooEarly',

	function ()
	{
		it(
			'should be a Error from Exception',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () =>
			{
				let e = new reply.TooEarly('test')

				chai.expect(e).instanceof(Error)
				chai.expect(e.name).equals('TooEarly')
				chai.expect(e.errno).equals(425)
				chai.expect(e.data).be.an('array')
				// eslint-disable-next-line @typescript-eslint/unbound-method
				chai.expect(e.push).be.a('function')


			},

		)


	},

)


describe(
	'lib: reply.TooManyRequests',

	function ()
	{
		it(
			'should be a Error from Exception',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () =>
			{
				let e = new reply.TooManyRequests('test')

				chai.expect(e).instanceof(Error)
				chai.expect(e.name).equals('TooManyRequests')
				chai.expect(e.errno).equals(429)
				chai.expect(e.data).be.an('array')
				// eslint-disable-next-line @typescript-eslint/unbound-method
				chai.expect(e.push).be.a('function')


			},

		)


	},

)
