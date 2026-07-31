import dotenv from "dotenv"
dotenv.config();


/**
 * GEMINI_API_KEY;
 * MISTRAL_API_KEY
 * COHERE_API_KEY
*/


type config = {
    readonly GOOGLE_API_KEY:string,
    readonly MISTRAL_API_KEY:string,
    readonly COHERE_API_KEY:string,
    readonly MONGODB_URI:string
};


const env: config={
    GOOGLE_API_KEY:process.env.GOOGLE_API_KEY || "",
    MISTRAL_API_KEY:process.env.MISTRAL_API_KEY || "",
    COHERE_API_KEY :process.env.COHERE_API_KEY || "",
    MONGODB_URI:process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/aibattlearena"
}


export default env;