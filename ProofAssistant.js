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
  constructor(pt, gHyps)
  {
    this.pt = pt;       //ProofTree
    this.gHyps = gHyps; //List of ProofTrees
  }
  
  toString(showGHyps)
  {
    let s = "";
    if(showGHyps)
    {
      if(this.gHyps.length > 0)
        s = "Hypotheses:\n";
      for(let h of this.gHyps)
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
    
    this.applyTac = new ApplyTac(this);
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
    this.proofTree = new ProofTree(this.stmt, null, null);
    
    let gHyps = [];
    for(let h of this.scope)
    {
      if(h.keyword !== "$e")
        continue;
      if(h.typecode !== "|-")
        throw "runProofScript: $e hypothesis has unexpected typecode: " + h.typecode;
      h.parseTree = this.mathParser.parseMathExpr(h.assertion, "wff", this.varTypes);
      gHyps.push(new ProofTree(h, null, null));
    }
    this.goalStackStack = [[new Goal(this.proofTree, gHyps)]];
    
    for(let cmd of this.proofScript)
    {
      switch(cmd.keyword)
      {
      case "$ap":
        let goalStack = this.goalStackStack.at(-1);
        if(goalStack.length == 0)
          throw "runProofScript: No goal to apply tactic to!";
        let mainGoal = goalStack.pop();
        let newGoals = this.applyTac.apply(mainGoal, cmd.args);
        goalStack.push(...newGoals);
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
  
  static unifyParseTreesHelper(t1, t2, subst)
  {
    if(t1 instanceof VarNode)
    {
      let im = subst.get(t1.varName);
      if(im === undefined)
      {
        subst.set(t1.varName, t2);
        return subst;
      }
      else
      {
        if(MathParser.parseTreesEq(im, t2))
          return subst;
        else
          return false;
      }
    }
    else
    {
      if(t1.rule !== t2.rule)
        return false;
      let cs1 = t1.childNodes;
      let cs2 = t2.childNodes;
      if(cs1.length !== cs2.length)
        throw "unifyParseTreesHelper: Trees have same rule but different number of children."
      for(let i = 0;i < cs1.length;i++)
      {
        if(!ProofAssistant.unifyParseTreesHelper(cs1[i], cs2[i], subst))
          return false;
      }
      return subst;
    }
  }

  //Returns the substitution (map from var names to parse trees) 
  //s such that s(t1) = t2, if it exists, otherwise returns false.
  //The support of s is all variables occuring in t1.
  static unifyParseTrees(t1, t2)
  {
    let subst = new Map();
    return ProofAssistant.unifyParseTreesHelper(t1, t2, subst)
  }
}