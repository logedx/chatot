import * as chai from 'chai'

import * as secret from '../../src/lib/secret.js'



describe(
	'lib: secret.hex',

	function () {
		it(
			'should return a random hex string',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () => {
				let hex = secret.hex()

				chai.expect(hex).to.match(/^[0-9a-f]{32}$/)


			},

		)


	},

)



describe(
	'lib: secret.AES_256_CBC',

	function () {
		it(
			'should be able to encrypt and decrypt correctly',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () => {
				let plain = 'Node.js® is a free, open-source, cross-platform JavaScript run-time environment—that lets developers write command line tools and server-side scripts outside of a browser.'

				let aes = new secret.AES_256_CBC()

				let encrypt = aes.encrypt(plain)
				let decrypt = aes.decrypt(encrypt)

				let encrypt_with_pkcs7 = aes.encrypt_with_pkcs7(plain)
				let decrypt_with_pkcs7 = aes.decrypt_with_pkcs7(encrypt_with_pkcs7)

				chai.expect(encrypt).instanceOf(Buffer)
				chai.expect(decrypt).instanceOf(Buffer)

				chai.expect(encrypt_with_pkcs7).instanceOf(Buffer)
				chai.expect(decrypt_with_pkcs7).instanceOf(Buffer)



				chai.expect(
					decrypt.toString('utf8'),

				)
					.equal(plain)


				chai.expect(
					decrypt_with_pkcs7.toString('utf8'),

				)
					.equal(plain)



			},

		)


	},

)


describe(
	'lib: secret.AES_256_CCM',

	function () {
		it(
			'should be able to encrypt and decrypt correctly',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () => {
				let plain = 'Node.js® is a free, open-source, cross-platform JavaScript run-time environment—that lets developers write command line tools and server-side scripts outside of a browser.'


				let aes = new secret.AES_256_CCM()

				let encrypt = aes.encrypt(plain)
				let decrypt = aes.decrypt(encrypt)

				let encrypt_with_pkcs7 = aes.encrypt_with_pkcs7(plain)
				let decrypt_with_pkcs7 = aes.decrypt_with_pkcs7(encrypt_with_pkcs7)

				chai.expect(encrypt).instanceOf(Buffer)
				chai.expect(decrypt).instanceOf(Buffer)

				chai.expect(encrypt_with_pkcs7).instanceOf(Buffer)
				chai.expect(decrypt_with_pkcs7).instanceOf(Buffer)


				chai.expect(
					decrypt.toString('utf8'),

				)
					.equal(plain)


				chai.expect(
					decrypt_with_pkcs7.toString('utf8'),

				)
					.equal(plain)


			},

		)


	},

)


describe(
	'lib: secret.AES_256_GCM',

	function () {
		it(
			'should be able to encrypt and decrypt correctly',

			// eslint-disable-next-line @typescript-eslint/require-await
			async () => {
				let plain = 'Node.js® is a free, open-source, cross-platform JavaScript run-time environment—that lets developers write command line tools and server-side scripts outside of a browser.'


				let aes = new secret.AES_256_GCM()

				let encrypt = aes.encrypt(plain)
				let decrypt = aes.decrypt(encrypt)

				let encrypt_with_pkcs7 = aes.encrypt_with_pkcs7(plain)
				let decrypt_with_pkcs7 = aes.decrypt_with_pkcs7(encrypt_with_pkcs7)

				chai.expect(encrypt).instanceOf(Buffer)
				chai.expect(decrypt).instanceOf(Buffer)

				chai.expect(encrypt_with_pkcs7).instanceOf(Buffer)
				chai.expect(decrypt_with_pkcs7).instanceOf(Buffer)


				chai.expect(
					decrypt.toString('utf8'),

				)
					.equal(plain)


				chai.expect(
					decrypt_with_pkcs7.toString('utf8'),

				)
					.equal(plain)


			},

		)


	},

)
