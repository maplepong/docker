/* @jsx myReact.createElement */
import myReact from "../core/myReact.js";

const Undefined = () => {
	return <div>
		<h1>
			페이지를 찾을 수 없습니다.
		</h1>
		<Link to="home">
			홈으로 돌아가기
		</Link>
	</div>
}

export default Undefined;