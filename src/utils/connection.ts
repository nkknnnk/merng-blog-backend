import {connect} from "mongoose"

export const connectToDatabase = async() => {
    try {
        await connect(`${process.env.MONGO_URI}`)
    } catch (error) {
        console.log(error)
        return error
    }
}