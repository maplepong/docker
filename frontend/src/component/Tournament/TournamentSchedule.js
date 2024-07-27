/* @jsx myReact.createElement */
import myReact from "../../core/myReact.js";

const TournamentSchedule = ({braket, status}) => {
  
  return (
    <div>
      <h1> Tournament Schedule </h1>
        <p>braket : {braket}</p>
        <p>status : {status}</p>
    </div> 
  )
};

export default TournamentSchedule;
