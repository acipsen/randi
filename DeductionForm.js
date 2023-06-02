class DeductionForm
{
  static IMPLABEL = "wi";
  static ANDLABEL = "wa";
  
  static trySplitImp(pt)
  {
    if(pt instanceof VarNode)
      return false;
    if(!(pt instanceof RuleNode))
      throw "trySplitImp: Argument is not a parse tree!";
    if(pt.rule.label === DeductionForm.IMPLABEL)
      return {ant: pt.childNodes[0], con: pt.childNodes[1]};
    else
      return false;
  }
  
  static trySplitAnd(pt)
  {
    if(pt instanceof VarNode)
      return false;
    if(!(pt instanceof RuleNode))
      throw "trySplitAnd: Argument is not a parse tree!";
    if(pt.rule.label === DeductionForm.ANDLABEL)
      return {left: pt.childNodes[0], right: pt.childNodes[1]};
    else
      return false;
  }
  
  //Turns a proof tree of the form ( ... ( ( ph1 /\ ph2 ) /\ ph3 ) ... /\ phN ) 
  //into [ph1, ..., phN]
  static splitAnds(pt)
  {
    let spt = DeductionForm.trySplitAnd(pt);
    if(spt)
      return DeductionForm.splitAnds(spt.left).concat([spt.right]);
    else
      return [pt];
  }
  
  static splitAntsCon(pt)
  {
    let spl = DeductionForm.trySplitImp(pt);
    if(spl)
      return {ants: DeductionForm.splitAnds(spl.ant), con: spl.con};
    else
      return {ants: [], con: pt};
  }
  
  static proofTreeToStringSequentStyle(pt)
  {
    let {ants, con} = DeductionForm.splitAntsCon(pt);
    return ants.join(", ") + " |- " + con;
  }
}