class ApplyTac
{
  constructor(pa)
  {
    this.db = pa.db;
    this.mathParser = pa.db.mathParser;
    this.varTypes = pa.varTypes;
  }
  
  apply(goal, args)
  {
    if(args.length == 0 || args[0].length == 0)
      throw "ApplyTac: missing theorem.";
    
    let thm = this.db.thmMap.get(args[0][0]);
    if(thm === undefined)
      throw "ApplyTac: Unknown theorem: " + args[0][0];
      
    if(thm.stmt.typecode !== "|-")
      throw "ApplyTac: Unexpected typecode: " + thm.stmt.typecode;
      
    let thmTree = this.mathParser.parseThm(thm);
    let goalTree = goal.pt.stmt.parseTree;
    
    console.log("thmTree: " + thmTree);
    console.log("goalTree: " + goalTree);
    
    let subst = ProofAssistant.unifyParseTrees(thmTree, goalTree);
    
    if(!subst)
      throw "ApplyTac: Unable to unify thm with goal";
      
    let argsIdx = 1;
    for(let h of thm.hyps)
    {
      if(h.keyword !== "$f" || subst.get(h.assertion[0]) !== undefined)
        continue;
      if(argsIdx >= args.length)
        throw "ApplyTac: No substitution for var " + h.assertion[0];
      let argTree = this.mathParser.parseMathExpr(args[argsIdx], h.typecode, this.varTypes);
      subst.set(h.assertion[0], argTree);
      argsIdx++;
    }
    
    if(argsIdx !== args.length)
      throw "ApplyTac: To many arguments.";
    
    let tokSubst = new Map();
    for(const [vn, tree] of subst)
      tokSubst.set(vn, tree.toTokenList());
    
    let newGoals = [];
    let newProofTrees = [];
    for(let h of thm.hyps)
    {
      if(h.keyword !== "$e")
        continue;
      if(h.typecode !== "|-")
        throw "ApplyTac: $e hyp of theorem has unexpected typecode:" + h.typecode;
      let gStmt = new MMStatement(null, "$PA", "$p", "|-", MMDb.substTokList(h.assertion, tokSubst), null);
      gStmt.parseTree = this.mathParser.parseMathExpr(gStmt.assertion, "wff", this.varTypes);
      let gPt = new ProofTree(gStmt, null, null);
      newProofTrees.push(gPt);
      let g = new Goal(gPt, goal.gHyps); //FIXME: Should we copy the gHyps array?
      newGoals.push(g);
    }
    
    goal.pt.thm = thm;
    goal.pt.subTrees = newProofTrees;
    
    return newGoals;
  }
}