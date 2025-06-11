import { Schema, Model, HydratedDocument } from 'mongoose'


export type TPointRawDocType = {
	type       : string
	coordinates: [number, number]

}

export type TPointVirtuals = object

export type TPointQueryHelpers = object

export type TPointInstanceMethods = object

export type TStaticMethods = object


export type TPointHydratedDocumentType = HydratedDocument<TPointRawDocType, TPointVirtuals >

export type TPointModel = Model<TPointRawDocType, TPointQueryHelpers, TPointInstanceMethods, TPointVirtuals>







// Don't do `{ location: { type: String } }`
// 'location.type' must be 'Point'
export const point = new Schema
<
	TPointRawDocType,
	TPointModel,
	TPointInstanceMethods,
	TPointQueryHelpers,
	TPointVirtuals,
	TStaticMethods

// eslint-disable-next-line func-call-spacing
>
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

)
