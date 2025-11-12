const mapService=require("../services/maps.service")
const {validationResult}=require("express-validator")

module.exports.getCoordinates=async (req,res,next)=>{

    const errors=validationResult(req);
    if(!errors.isEmpty())
    {
        return res.status(400).json({errors: errors.array()})
    }
    const {address}=req.query;

    try{
        const coordinates=await mapService.getAddressCoordinate(address);
        res.status(200).json(coordinates);
    }
    catch(error){
        res.status(500).json({error:"Internal server error"})
    }
}

module.exports.getDistanceTime=async (req,res,next)=>{

    const errors=validationResult(req);
    if(!errors.isEmpty())
    {
        return res.status(400).json({errors: errors.array()})
    }

    const {origin,destination}=req.query;

    try{
        const result=await mapService.getDistanceAndTime(origin,destination);
        res.status(200).json(result);
    }
    catch(error){
        res.status(500).json({error:"Internal server error"})
    }
}

module.exports.getSuggestions=async (req,res,next)=>{

    const errors=validationResult(req);
    if(!errors.isEmpty())
    {
        return res.status(400).json({errors: errors.array()})
    }
    const {input}=req.query;
    try{
        const result=await mapService.getAutoCompleteSuggestions(input);
        res.status(200).json(result);
    }
    catch(error){
        res.status(500).json({error:"Internal server error"})
    }
}