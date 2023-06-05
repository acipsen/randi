class NotAssumptionError extends Error 
{
  constructor(message) {
    super(message);
    this.name = 'NotAssumptionError';
  }
}

class ByAssumptionTac
{
  constructor(pa)
  {
    this.pa = pa;
    this.db = pa.db;
    this.mathParser = pa.db.mathParser;
    this.varTypes = pa.varTypes;
  }
  
  apply(goal, args)
  {
    let idx = goal.gHyps.findIndex((gh) =>
                MathParser.parseTreesEq(goal.pt.stmt.parseTree, gh.stmt.parseTree));
    if(idx !== -1)
    {
      if(goal.gHyps[idx].stmt.keyword === "$e")
      {
        goal.pt.stmt = goal.gHyps[idx].stmt;
      }
      else
      {
        //FIXME: TODO. 
        //The matching gHyp might be a goal, so we cannot
        //simply copy it over to goal.pt. One solution
        //could be to make goal.pt an indirection node which
        //simply point to the gHyp.
        throw new Error("TODO");
      }
      return;
    }
    
    let {ants: gAnts, con: gCon} = DeductionForm.splitAntsCon(goal.pt.stmt.parseTree);
    idx = gAnts.findLastIndex((a) => MathParser.parseTreesEq(gCon, a));
    if(idx === -1)
      throw new NotAssumptionError("Consequent not an assumption: " + gCon);
    console.log("ByAssumptionTac: found consequent at idx: " + idx);
    
    if(gAnts.length === 1)
    {
      let gs = this.pa.applyTac.apply(goal, [["id"]]);
      if(gs.length > 0)
        throw new Error("'$ap id' returned goals");
    }
    else if(idx === gAnts.length - 1)
    {
      let gs = this.pa.applyTac.apply(goal, [["simpr"]]);
      if(gs.length > 0)
        throw new Error("'$ap simpr' returned goals");
    }
    else
    {
      throw new NotAssumptionError("TODO");
    }
  }
}