import { Schema } from 'mongoose'


import * as model from '../lib/model.js'

import * as database from '../store/database.js'




// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Point
{
	export type Model = model.Define<
		{
			type       : string
			coordinates: [number, number]

		},

		{
			longitude: number
			latitude : number

		}

	>

	export type Schema = database.Schema<
		Model,

		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		{},

		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		{}

	>

	export type HydratedDocument = database.HydratedDocument<Schema>

}


// Don't do `{ location: { type: String } }`
// 'location.type' must be 'Point'
// eslint-disable-next-line @stylistic/function-call-spacing
export const point: Point.Schema = new Schema
(
	{
		type: {
			type    : String,
			required: true,
			trim    : true,
			enum    : ['Point'],
			default : 'Point',

		},

		coordinates: {
			type    : [Number],
			required: true,

		},

	},

	{
		virtuals: {
			longitude: {
				get ()
				{
					let [v] = this.coordinates

					return v ?? 0

				},


			},

			latitude: {
				get ()
				{
					let [, v] = this.coordinates

					return v ?? 0

				},


			},


		},


	},


)
