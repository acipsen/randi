class HaveTac
{
  constructor(pa)
  {
    this.db = pa.db;
    this.mathParser = pa.db.mathParser;
    this.varTypes = pa.varTypes;
  }
  
  apply(goal, args)
  {
    if(args.length === 0)
      throw new Error("The $ha tactic needs one argument.");
    if(args.length > 2)
      throw new Error("Too many arguments to $ha.");
    let withAntsFromGoal = true;
    if(args.length == 2 && args[1].length > 0 && args[1][0] === "false")
      withAntsFromGoal = false;
    
    let lemTree = this.mathParser.parseMathExpr(args[0], "wff", this.varTypes);
    let lemStmt = new MMStatement(null, "$PA", "$p", "|-", lemTree.toTokenList(), null);
    lemStmt.parseTree = lemTree;
    let lemProofTree = new ProofTree(lemStmt, null, null);
    let lemGoal = new Goal(lemProofTree, goal.gHyps);
    let gHyps = goal.gHyps.slice();
    gHyps.push(lemProofTree);
    return [new Goal(goal.pt, gHyps), lemGoal];
  }
}