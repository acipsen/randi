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
      for(let h of this.ghyps)
      {
        s += h.stmt.assertion.join(" ") + "\n";
      }
    }
    return s + "|- " + this.pt.stmt.assertion.join(" ");
  }
}

class ProofAssistant
{
  constructor(stmt, scope)
  {
    this.stmt = stmt;
    this.scope = scope;
  }
  
  runProofScript(proofScriptString)
  {
    let toks = proofScriptString.split(/\s+/);
    //Trailing white-space results in an empty string as the last element of the
    //array. We thus remove this element.
    if(toks.length > 0 && toks.at(-1) === "") 
      toks.pop();
    this.proofScript = ProofAssistant.parseProofScript(toks);
    
    let pt = new ProofTree(this.stmt, null, null);
    let ghyps = [];
    for(let h of this.scope)
    {
      if(h.keyword === "$e")
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