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

class ProofAssistant
{
  static keywords = ["${", "$}", "$?}", "$ap"];
  static parseProofScript(ps)
  {
    let i = 0;
    let cmds = [];
    
    while(i < ps.length)
    {
      if(ps[i].indexOf("$") === -1)
        throw "parseProofScript: Expected keyword, got: " + ps[i];
      let keyword = ps[i];
      if(!ProofAssistant.keywords.includes(keyword))
      {
        if(i == ps.length - 1)
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
      for(;i < ps.length;i++)
      {
        if(ps[i].indexOf("$") !== -1)
        {
          if(ps[i] === "$,")
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
          arg.push(ps[i])
        }
      }
      if(args.length + arg.length > 0) //If no arguments are given we let args be empty
        args.push(arg);
      cmds.push(new PSCmd(keyword, args));
    }
    
    return cmds;
  }
}