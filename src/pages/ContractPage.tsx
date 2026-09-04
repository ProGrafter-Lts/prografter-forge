import { Navigate, useParams } from "react-router-dom";

/**
 * Legacy deep link. The contract no longer has its own page — it opens as a
 * panel over the single project screen, so existing links (emails, activity
 * items, bookmarks) redirect there with the contract panel already open.
 */
const ContractPage = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/project/${id}?panel=contract` : "/"} replace />;
};

export default ContractPage;
