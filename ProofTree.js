class ProofTree
{
  //There are three basic kinds of proof trees:
  //ordinary proof step: new ProofTree({keyword: "$p", ...}, thm, subTrees)
  //missing proof step:  new ProofTree({keyword: "$p", ...}, null, null)
  //hypothesis:          new ProofTree({keyword: "$e", ...}, null, null)
  constructor(stmt, thm, subTrees)
  {
    this.stmt = stmt; 
    this.thm = thm;
    this.subTrees = subTrees;
  }
}