class PSCmd
{
  constructor(keyword, args)
  {
    this.keyword = keyword;
    this.args = args;
  }
  
  toString()
  {
    return this.keyword + " " 
      + this.args.map(arg => arg.join(" ")).join(" $, ");
  }
}

class Goal
{
  constructor(pt, ghyps)
  {
    this.pt = pt;       //ProofTree
    this.ghyps = ghyps; //List of ProofTrees
  }
  
  toString(showGHyps)
  {
    let s = "";
    if(showGHyps)
    {
      if(this.ghyps.length > 0)
        s = "Hypotheses:\n";
      for(let h of this.ghyps)
      {
        s += DeductionForm.proofTreeToStringSequentStyle(h.stmt.parseTree) + "\n"; //h.stmt.assertion.join(" ") + "\n";
      }
      s += "Goal:\n";
    }
    return s + DeductionForm.proofTreeToStringSequentStyle(this.pt.stmt.parseTree);
  }
}

class ProofAssistant
{
  constructor(db)
  {
    this.stmt = db.paThm.stmt;
    this.scope = db.paScope;
    this.db = db;
    this.mathParser = db.mathParser;
    this.varTypes = MMDb.varTypesOfHyps(this.scope);
  }
  
  runProofScript(proofScriptString)
  {
    let toks = proofScriptString.split(/\s+/);
    //Trailing white-space results in an empty string as the last element of the
    //array. We thus remove this element.
    if(toks.length > 0 && toks.at(-1) === "") 
      toks.pop();
    this.proofScript = ProofAssistant.parseProofScript(toks);
    
    if(this.stmt.typecode !== "|-")
        throw "runProofScript: Goal statement has unexpected typecode: " + this.stmt.typecode;
    this.stmt.parseTree = this.mathParser.parseMathExpr(this.stmt.assertion, "wff", this.varTypes);
    let pt = new ProofTree(this.stmt, null, null);
    
    let ghyps = [];
    for(let h of this.scope)
    {
      if(h.keyword !== "$e")
        continue;
      if(h.typecode !== "|-")
        throw "runProofScript: $e hypothesis has unexpected typecode: " + h.typecode;
      h.parseTree = this.mathParser.parseMathExpr(h.assertion, "wff", this.varTypes);
      ghyps.push(new ProofTree(h, null, null));
    }
    this.goalStack = [[new Goal(pt, ghyps)]];
    
    for(let cmd of this.proofScript)
    {
      switch(cmd.keyword)
      {
      case "$ap":
        break;
      default:
        throw "runProofScript: Unexpected keyword: " + cmd.keyword;
      }
    }
  }
  
  static keywords = ["${", "$}", "$?}", "$ap"];
  static parseProofScript(toks)
  {
    let i = 0;
    let cmds = [];
    
    while(i < toks.length)
    {
      if(toks[i].indexOf("$") === -1)
        throw "parseProofScript: Expected keyword, got: " + toks[i];
      let keyword = toks[i];
      if(!ProofAssistant.keywords.includes(keyword))
      {
        if(i == toks.length - 1)
          break; //If the *last* token of the proof script is broken, we just ignore it
        else
          throw "parseProofScript: Unexpected keyword: " + keyword;
      }
      i++;
      if(["${", "$}", "$?}"].includes(keyword))
      {
        cmds.push(new PSCmd(keyword, []));
        continue;
      }
      let arg = [];
      let args = [];
      for(;i < toks.length;i++)
      {
        if(toks[i].indexOf("$") !== -1)
        {
          if(toks[i] === "$,")
          {
            args.push(arg);
            arg = [];
          }
          else
          {
            break;  //If we find a keyword which is not "$," it must be a new command
          }
        }
        else
        {
          arg.push(toks[i])
        }
      }
      if(args.length + arg.length > 0) //If no arguments are given we let args be empty
        args.push(arg);
      cmds.push(new PSCmd(keyword, args));
    }
    
    return cmds;
  }
}