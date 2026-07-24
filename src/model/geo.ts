import { Schema } from 'mongoose'


import * as database from '../store/database.js'


import * as geo from '../schema/geo.js'




// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Point
{
	export type Define = geo.Point

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export type Methods = {}

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export type Statics = {}

	export type Schema = database.Schema<Point.Define, Point.Methods, Point.Statics>

	export type Keywords = database.Probe<Point.Define>

	export type Document = database.Document<Point.Schema>


}


// Don't do `{ location: { type: String } }`
// 'location.type' must be 'Point'
// eslint-disable-next-line @stylistic/function-call-spacing
export const point_schema: Point.Schema = new Schema
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
