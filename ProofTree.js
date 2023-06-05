class ProofTree
{
  //There are three basic kinds of proof trees:
  //ordinary proof step: new ProofTree({keyword: "$p", ...}, thm, subTrees)
  //missing proof step:  new ProofTree({keyword: "$p", ...}, null, null)
  //hypothesis:          new ProofTree({keyword: "$e", ...}, null, null)
  //The subTrees, if present, correspond to the $e hypotheses.
  constructor(stmt, thm, subTrees)
  {
    this.stmt = stmt; 
    this.thm = thm;
    this.subTrees = subTrees;
  }
  
  
  toStringHelper(lineNo)
  {
    let s = "";
    let cLineNos = [];
    
    if(this.subTrees)
    {
      for(let t of this.subTrees)
      {
        let cs;
        cLineNos.push(lineNo);
        ({s : cs, lineNo} = t.toStringHelper(lineNo));
        s += cs + "\n";
      }
    }
    
    s += lineNo + ": " + this.stmt.assertion.join(" ") + " by ";
    
    if(this.thm)
      s += this.thm.stmt.label;
    else if(this.stmt.keyword === "$e")
      s += this.stmt.label;
    else
      s += "?";
    
    if(cLineNos.length > 0)
      s += "[" + cLineNos.join(",") + "]";
    
    return {s , lineNo: lineNo + 1};
  }
  
  toString()
  {
    return this.toStringHelper(1).s;
  }
}