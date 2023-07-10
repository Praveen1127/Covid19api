const express = require("express");
const app = express();
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
app.use(express.json());
const databasePath = path.join(__dirname, "covid19India.db");
let database = null;
const objectSnakeToCamel=(newObject)=>{
    return{
        stateId:newObject.state_id,
        stateName:newObject.state_name,
        population:newObject.population
    };
};
const reportSnakeToCamelCase=(newObject)=>{
  return{
  totalCases:newObject.cases,
  totalCured:newObject.cured,
  totalActive:newObject.active,
  totalDeaths:newObject.deaths,
  };
}
const districtSnaketoCamel=(newObject)=>{
  return{
    districtid:newObject.district_id,
    districtName:newObject.district_name,
    stateId:newObject.state_id,
    cases:newObject.cases,
    cured:newObject.cured,
    active:newObject.active,
    deaths:newObject.deaths,
  }
}
const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3300/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer()
//api1is working
app.get("/states/",async(request,response)=>{
    const allStatesList=`SELECT * 
    FROM state 
    ORDER BY state_id`;
    const stateList=await database.all(allStatesList);
    const stateResult=stateList.map((eachObject)=>{
        return objectSnakeToCamel(eachObject);
    })
    response.send(stateResult)
})
//api2 working
app.get("/states/:stateId/",async(request,response)=>{
    const{stateId}=request.params;
    const getState=`SELECT * 
    FROM state 
    where state_id=${stateId};`;
    const newState=await database.get(getState);
    const stateResult=objectSnakeToCamel(newState)
    response.send(stateResult)
})
//api3 //pending
app.post("/districts/", async (request, response) => {
  const { districtName,stateId,cases,cured,active,deaths } = request.body;
  const poststateQuery = `
  INSERT INTO
    district (district_name,state_id,cases,cured,active,deaths)
  VALUES
    (${districtName},${stateId},${cases},${cured},${active},${deaths});`;
  const addistrict = await database.run(poststateQuery);
  const districtId=addistrict.lastId;
  response.send("District Successfully Added");
});
//api4 working
app.get("/districts/:districtId/",async(request,response)=>{
    const{districtId}=request.params;
    const getDistrict=`SELECT * 
    FROM district
    where district_id=${districtId};`;
    const newDistrict=await database.get(getDistrict);
    const districtResult=districtSnaketoCamel(newDistrict);
    response.send(districtResult);
})
//api5 //pending
app.delete("/districts/:districtId/",async(request,response)=>{
    const{districtId}=request.params;
    const deleteDistrict=`delete
    FROM district
    where district_id=${districtId} `;
    await database.run(deleteDistrict);
    response.send("District Removed");
});

//api6 pending
app.put("/districts/:districtId/",async(request,response)=>{
    const{districtName,stateId,cases,cured,active,deaths}=request.params;
    const updateDistrict=`update District 
    SET
    district_name=${districtName},
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    where 
    district_id=${districtId}
    `
    await database.run(updateDistrict);
    response.send("District Details Updated");
})
//api7  working
app.get("/states/:stateId/stats/",async(request,response)=>{
    const{stateId}=request.params;
    const getStateReport=`SELECT SUM(cases) as cases,
    SUM(cured) as cured,
    SUM(active) as active,
    SUM(deaths) as deaths
    FROM district
    where state_id=${stateId};`;
    const stateReport=await database.get(getStateReport);
    const resultReport=reportSnakeToCamelCase(stateReport)
    response.send(resultReport)
})
//api8 //pending
app.get("/districts/districtId/details/",async(request,response)=>{
   const{districtId}=request.params;
   const detailsQuery=`select start_name from
    state join district 
    on state.state_id=district.state_id 
    where district.district_id=${districtId};`;
   const stateName=await database.get(detailsQuery);
   response.send({stateName:stateName.state_name});

})
module.exports=app;




