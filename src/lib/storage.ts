import config from 'config'
import alioss from 'ali-oss'
import mongoose from 'mongoose'


type Connect = {
	ali_oss: null | alioss
	mongodb: null | typeof mongoose

}

const connect: Connect = { ali_oss: null, mongodb: null }


const mongodb_uri = config.get<string>('mongodb')

const aliopen_endpoint = config.get<string>('aliopen.endpoint')
const aliopen_access_key_id = config.get<string>('aliopen.access_key_id')
const aliopen_access_key_secret = config.get<string>('aliopen.secret_access_key')





export type TExtendRawDocType = {
	updated: Date
	created: Date

	updated_hex: string
	created_hex: string

}

export type TRawDocType<T> = T & TExtendRawDocType


export async function mongodb(): Promise<typeof mongoose> {
	if (connect.mongodb) {
		return connect.mongodb

	}


	mongoose.plugin(
		function (schema): void {
			schema.set(
				'toJSON',

				{
					virtuals: true,
					minimize: false,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					versionKey: false,

				},

			)

			schema.set(
				'toObject',

				{
					virtuals: true,
					minimize: false,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					versionKey: false,

				},

			)

			schema.set(
				'timestamps',

				{
					// eslint-disable-next-line @typescript-eslint/naming-convention
					updatedAt: 'updated',
					// eslint-disable-next-line @typescript-eslint/naming-convention
					createdAt: 'created',

				},

			)

			schema.virtual('updated_hex').get(
				function (): string {
					if (this.updated instanceof Date) {
						let value = this.updated.valueOf()

						return value.toString(16)

					}

					return ''

				},

			)

			schema.virtual('created_hex').get(
				function (): string {
					if (this.created instanceof Date) {
						let value = this.created.valueOf()

						return value.toString(16)

					}

					return ''

				},

			)

		},

	)

	connect.mongodb = await mongoose.connect(mongodb_uri)


	return connect.mongodb

}


/**
 * ali_oss
 */
export function ali_oss(): alioss {
	if (connect.ali_oss === null) {
		// eslint-disable-next-line new-cap
		connect.ali_oss = new alioss(
			{
				region: `oss-${aliopen_endpoint}`,

				// eslint-disable-next-line @typescript-eslint/naming-convention
				accessKeyId: aliopen_access_key_id,

				// eslint-disable-next-line @typescript-eslint/naming-convention
				accessKeySecret: aliopen_access_key_secret,

			},

		)

	}

	return connect.ali_oss

}