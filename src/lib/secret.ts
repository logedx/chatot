import crypto from 'node:crypto'
import { EventEmitter } from 'node:events'

import * as reply from './reply.js'
import * as detective from './detective.js'


/**
 * Randomly generate a hexadecimal string
 */
export function hex (length = 32): string
{
	let RADIX = 16

	return Array(length)
		.fill(0)
		.map(
			() => Math.floor(Math.random() * RADIX).toString(RADIX),

		)
		.join('')

}

/**
 * generate a delay time
 */
export function delay (seconds: number): Date
{
	let v = new Date()

	v.setSeconds(
		v.getSeconds() + seconds,

	)

	return v

}


type CryptoPipelineCreateHandler = (
	value: Buffer,
	option: { algorithm: string, key: Buffer, iv: Buffer },

)
=> crypto.Cipher

type CryptoPipelineConcatHandler = (transfer: crypto.Cipher | crypto.Decipher, valuve: Buffer) => Buffer

type CryptoPipelinePaddingHandler = (valuve: Buffer) => Buffer



type CryptoPipeline = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	replace(name: string, handler: (...arg: any[]) => any): CryptoPipeline

	execute(value: Buffer): Buffer

}

class CryptoManager
{
	// 加密算法
	readonly algorithm: string

	// 密钥
	readonly key: Buffer

	// 初始化向量
	readonly iv: Buffer

	create_handler: null | CryptoPipelineCreateHandler = null

	concat_handler: null | CryptoPipelineConcatHandler = null

	padding_handler: null | CryptoPipelinePaddingHandler = null


	constructor (algorithm: string, key: Buffer, iv: Buffer)
	{
		this.algorithm = algorithm
		this.key = key
		this.iv = iv

	}

	replace
	(name: 'create', handler: CryptoPipelineCreateHandler): this

	replace
	(name: 'concat', handler: CryptoPipelineConcatHandler): this

	replace
	(name: 'padding', handler: CryptoPipelinePaddingHandler): this

	replace
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(name: string, handler: (...arg: any[]) => any): this
	{
		if (name === 'create')
		{
			this.create_handler = handler

		}

		if (name === 'concat')
		{
			this.concat_handler = handler

		}

		if (name === 'padding')
		{
			this.padding_handler = handler

		}


		return this


	}

}

class Encrypt extends CryptoManager implements CryptoPipeline
{
	#create (value: Buffer): crypto.Cipher
	{
		if (this.create_handler)
		{
			return this.create_handler(
				value,

				{ algorithm: this.algorithm, key: this.key, iv: this.iv },

			)


		}

		return crypto.createCipheriv(this.algorithm, this.key, this.iv)

	}


	#concat (cipher: crypto.Cipher, value: Buffer): Buffer
	{
		if (this.concat_handler)
		{
			return this.concat_handler(cipher, value)

		}

		return Buffer.concat(
			[cipher.update(value), cipher.final()],

		)

	}


	execute (value: Buffer): Buffer
	{
		let cipher = this.#create(value)

		if (this.padding_handler)
		{
			cipher.setAutoPadding(false)

			value = this.padding_handler(value)

		}

		return this.#concat(cipher, value)

	}



}

class Decrypt extends CryptoManager implements CryptoPipeline
{
	#create (value: Buffer): crypto.Cipher
	{
		if (this.create_handler)
		{
			return this.create_handler(
				value,

				{ algorithm: this.algorithm, key: this.key, iv: this.iv },

			)


		}

		return crypto.createDecipheriv(this.algorithm, this.key, this.iv)

	}

	#concat (cipher: crypto.Decipher, value: Buffer): Buffer
	{
		if (this.concat_handler)
		{
			return this.concat_handler(cipher, value)

		}

		return Buffer.concat(
			[cipher.update(value), cipher.final()],

		)

	}


	execute (value: Buffer): Buffer
	{
		let cipher = this.#create(value)

		if (this.padding_handler)
		{
			cipher.setAutoPadding(false)

			value = this.#concat(cipher, value)

			return this.padding_handler(value)

		}

		return this.#concat(cipher, value)

	}



}

type AESCryptoManager = {
	encrypt(value: string | Buffer): Buffer
	decrypt(value: string | Buffer): Buffer

	encrypt_with_pkcs7(value: string | Buffer): Buffer
	decrypt_with_pkcs7(value: string | Buffer): Buffer

}

/**
 * 高级加密标准，需对齐这五个参数才能完成加解密过程。
 * 1. Key Length: 密钥长度；
 * 2. Key: 密钥本身；
 * 3. IV: 初始向量；
 * 4. Mode: 加密模式；
 * 5. Padding: 填充方式。
 */
class AESManager
{
	// 加密算法
	readonly algorithm: string

	// 密钥
	readonly key: Buffer

	// 初始化向量
	readonly iv: Buffer


	// 分块尺寸。单位：字节
	static readonly pkcs7_block_size = 32

	// 载荷长度。单位：字节
	static readonly pkcs7_playload_length = 20

	// 消息体长度相对头部载荷偏移。单位：字节
	static readonly pkcs7_plain_length_offset = 16


	constructor
	(
		algorithm: string,

		key: string | Buffer = crypto.randomBytes(32),
		iv: string | Buffer = crypto.randomBytes(16),
	)
	{
		key = AESManager.normalized(key, 'utf8')
		iv = AESManager.normalized(iv, 'utf8')


		if (key.length !== 32)
		{
			throw new reply.BadRequest('the length of the key must be 32 bytes.')

		}

		if (iv.length !== 12 && iv.length !== 16)
		{
			throw new reply.BadRequest('the length of the iv must be 16 bytes.')

		}

		this.algorithm = algorithm
		this.key = key
		this.iv = iv

	}

	static normalized (value: string | Buffer, encoding: 'utf8' | 'hex'): Buffer
	{
		if (detective.is_string(value) )
		{
			value = Buffer.from(value, encoding)

		}

		return value

	}

	static pkcs7_pad (plain: Buffer): Buffer
	{
		// 载荷
		let payload = crypto.randomBytes(AES.pkcs7_playload_length)

		// 将消息体长度以大端序（网络字节序）写入载荷
		payload.writeUInt32BE(plain.length, AES.pkcs7_plain_length_offset)

		// 补位长度
		let repair = AES.pkcs7_block_size - (
			(AES.pkcs7_playload_length + plain.length) % AES.pkcs7_block_size

		)

		// 补位
		let repair_ = Buffer.alloc(repair, repair)

		// 拼接最终加密数据
		return Buffer.concat([payload, plain, repair_])

	}


	static pkcs7_unpad (plain: Buffer): Buffer
	{
		let offset = plain.readUInt32BE(AES.pkcs7_plain_length_offset)

		return plain.subarray(
			AES.pkcs7_playload_length,

			AES.pkcs7_playload_length + offset,

		)

	}


}


/**
 * 高级加密标准，需对齐这五个参数才能完成加解密过程。
 * 1. Key Length: 密钥长度；
 * 2. Key: 密钥本身；
 * 3. IV: 初始向量；
 * 4. Mode: 加密模式；
 * 5. Padding: 填充方式。
 */
class AES extends AESManager implements AESCryptoManager
{
	#encrypt (value: string | Buffer, is_padding = false): Buffer
	{
		value = AESManager.normalized(value, 'utf8')

		let pipeline = new Encrypt(this.algorithm, this.key, this.iv)

		if (is_padding)
		{
			// eslint-disable-next-line @typescript-eslint/unbound-method
			pipeline.replace('padding', AES.pkcs7_pad)

		}

		return pipeline.execute(value)

	}

	#decrypt (value: string | Buffer, is_padding = false): Buffer
	{
		value = AESManager.normalized(value, 'hex')

		let pipeline = new Decrypt(this.algorithm, this.key, this.iv)

		if (is_padding)
		{
			// eslint-disable-next-line @typescript-eslint/unbound-method
			pipeline.replace('padding', AES.pkcs7_unpad)

		}

		return pipeline.execute(value)


	}

	encrypt (value: string | Buffer): Buffer
	{
		return this.#encrypt(value)

	}

	decrypt (value: string | Buffer): Buffer
	{
		return this.#decrypt(value)

	}

	/**
	 * PKCS#7 填充加密
	 */
	encrypt_with_pkcs7 (value: string | Buffer): Buffer
	{
		return this.#encrypt(value, true)

	}


	/**
	 * PKCS#7 填充解密
	 */
	decrypt_with_pkcs7 (value: string | Buffer): Buffer
	{
		return this.#decrypt(value, true)

	}


}


// eslint-disable-next-line @typescript-eslint/naming-convention
class AES_AEAD extends AESManager implements AESCryptoManager
{
	#aad: Buffer = Buffer.from('')

	#auth_tag_length = 16

	set aad (value: string | Buffer)
	{
		this.#aad = AESManager.normalized(value, 'utf8')

	}

	#cipher_create_handler (
		aad: Buffer,
		auth_tag_length: number,
		plaintext_length: number,

	)
	: CryptoPipelineCreateHandler
	{
		return function (value, option)
		{
			let cipher = crypto.createCipheriv(
				option.algorithm as crypto.CipherCCMTypes,

				option.key,

				option.iv,

				// eslint-disable-next-line @typescript-eslint/naming-convention
				{ authTagLength: auth_tag_length },

			)

			cipher.setAAD(
				// eslint-disable-next-line @typescript-eslint/naming-convention
				aad, { plaintextLength: plaintext_length },

			)

			return cipher

		}


	}

	#decipher_create_handler (
		aad: Buffer,
		auth_tag_length: number,
		plaintext_length: number,

	)
	: CryptoPipelineCreateHandler
	{
		return function (value, option)
		{
			let decipher = crypto.createDecipheriv(
				option.algorithm as crypto.CipherCCMTypes,

				option.key,

				option.iv,

				// eslint-disable-next-line @typescript-eslint/naming-convention
				{ authTagLength: auth_tag_length },

			)

			decipher.setAAD(
				// eslint-disable-next-line @typescript-eslint/naming-convention
				aad, { plaintextLength: plaintext_length },

			)

			decipher.setAuthTag(
				value.subarray(0 - auth_tag_length),

			)

			return decipher

		}


	}

	#cipher_concat_handler (cipher: crypto.CipherCCM, value: Buffer): Buffer
	{
		return Buffer.concat(
			[cipher.update(value), cipher.final(), cipher.getAuthTag()],

		)

	}

	#decipher_concat_handler (auth_tag_length: number): CryptoPipelineConcatHandler
	{
		return function (cipher, value): Buffer
		{
			return Buffer.concat(
				[
					cipher.update(
						value.subarray(0, 0 - auth_tag_length),

					),

					cipher.final(),

				],

			)

		}

	}

	#encrypt (value: string | Buffer, is_padding = false): Buffer
	{
		value = AESManager.normalized(value, 'utf8')

		let pipeline = new Encrypt(this.algorithm, this.key, this.iv)

		pipeline.replace(
			'create',

			this.#cipher_create_handler(this.#aad, this.#auth_tag_length, value.length),

		)

		pipeline.replace(
			'concat',

			// eslint-disable-next-line @typescript-eslint/unbound-method
			this.#cipher_concat_handler as CryptoPipelineConcatHandler,

		)

		if (is_padding)
		{
			// eslint-disable-next-line @typescript-eslint/unbound-method
			pipeline.replace('padding', AES.pkcs7_pad)

		}

		return pipeline.execute(value)


	}

	#decrypt (value: string | Buffer, is_padding = false): Buffer
	{
		value = AESManager.normalized(value, 'hex')

		let pipeline = new Decrypt(this.algorithm, this.key, this.iv)


		pipeline.replace(
			'create',

			this.#decipher_create_handler(this.#aad, this.#auth_tag_length, value.length),

		)

		pipeline.replace(
			'concat',


			this.#decipher_concat_handler(this.#auth_tag_length),

		)

		if (is_padding)
		{
			// eslint-disable-next-line @typescript-eslint/unbound-method
			pipeline.replace('padding', AES.pkcs7_unpad)

		}

		return pipeline.execute(value)


	}



	encrypt (value: string | Buffer): Buffer
	{
		return this.#encrypt(value)

	}

	decrypt (value: string | Buffer): Buffer
	{
		return this.#decrypt(value)

	}

	/**
	 * PKCS#7 填充加密
	 */
	encrypt_with_pkcs7 (value: string | Buffer): Buffer
	{
		return this.#encrypt(value, true)

	}


	/**
	 * PKCS#7 填充解密
	 */
	decrypt_with_pkcs7 (value: string | Buffer): Buffer
	{
		return this.#decrypt(value, true)

	}



}


/**
 * 高级加密标准
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class AES_256_CBC extends AES
{
	constructor
	(
		key: string | Buffer = crypto.randomBytes(32),
		iv: string | Buffer = crypto.randomBytes(16),
	)
	{
		super('aes-256-cbc', key, iv)

	}

}


/**
 * 高级加密标准
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class AES_256_CCM extends AES_AEAD
{
	constructor
	(
		key: string | Buffer = crypto.randomBytes(32),
		iv: string | Buffer = crypto.randomBytes(12),
	)
	{
		super('aes-256-ccm', key, iv)

	}

}

/**
 * 高级加密标准
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class AES_256_GCM extends AES_AEAD
{
	constructor
	(
		key: string | Buffer = crypto.randomBytes(32),
		iv: string | Buffer = crypto.randomBytes(16),
	)
	{
		super('aes-256-gcm', key, iv)

	}

}




export class RSA extends EventEmitter
{
	#sign: Buffer = Buffer.from([])

	#evidence: Buffer = Buffer.from([])

	#verify: Buffer = Buffer.from([])

	#serial: [string, string] = ['', '']

	constructor (sign: Buffer, evidence: Buffer, verify: Buffer)
	{
		super()

		let x = new crypto.X509Certificate(evidence)

		this.#sign = sign
		this.#evidence = evidence
		this.#verify = verify
		this.#serial = [x.serialNumber, x.serialNumber]

		try
		{
			this.#serial[1] = new crypto.X509Certificate(verify).serialNumber

		}

		catch
		{
			// 

		}

	}

	get serial (): [string, string]
	{
		return this.#serial

	}

	update (name: 'evidence' | 'verify', ctx: string | Buffer): void
	{
		ctx = AESManager.normalized(ctx, 'utf8')


		let c = new crypto.X509Certificate(ctx)

		if (name === 'evidence')
		{
			this.#evidence = ctx

			this.#serial[0] = c.serialNumber

		}

		if (name === 'verify')
		{
			this.#verify = ctx

			this.#serial[1] = c.serialNumber

		}

		this.emit('update', name, ctx.toString('base64') )

	}

	encrypt (value: string | Buffer): Buffer
	{
		const { RSA_PKCS1_OAEP_PADDING } = crypto.constants

		return crypto.publicEncrypt(
			{ key: this.#verify, padding: RSA_PKCS1_OAEP_PADDING },

			AESManager.normalized(value, 'utf8'),

		)

	}

	decrypt (value: string | Buffer): Buffer
	{
		const { RSA_PKCS1_OAEP_PADDING } = crypto.constants

		return crypto.privateDecrypt(
			{ key: this.#sign, padding: RSA_PKCS1_OAEP_PADDING },

			AESManager.normalized(value, 'utf8'),
		)

	}

	sign
	(data: string | Buffer, algorithm = 'sha256WithRSAEncryption'): Buffer
	{
		let hashes = crypto.getHashes()

		if (hashes.includes(algorithm) === false)
		{
			throw new reply.BadRequest('`algorithm` Incorrect. Use crypto.getHashes() to obtain the names of the available digest algorithms.')

		}

		return crypto.createSign(algorithm)
			.update(data)
			.sign(this.#sign)

	}

	verify
	(data: string | Buffer, signature: Buffer, algorithm = 'sha256WithRSAEncryption'): boolean
	{
		let hashes = crypto.getHashes()

		if (hashes.includes(algorithm) === false)
		{
			throw new reply.BadRequest('`algorithm` Incorrect. Use crypto.getHashes() to obtain the names of the available digest algorithms.')

		}

		return crypto.createVerify(algorithm)
			.update(data)
			.verify(this.#verify, signature)

	}

}
