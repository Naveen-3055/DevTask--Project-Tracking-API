
const validate = (schema) => {
    return (req,res,next) => {
        const {error, value} = schema.validate(req.body,{
            abortEarly: false, // return all errors.
            stripUnknown: true, // remove fields not in schema
        });

        if(error){
            const errors = error.details.map((d) => d.message);
            return res.status(400).json({message: 'validation failed', erros});
        }

        req.body = value;
        next();
    };
};