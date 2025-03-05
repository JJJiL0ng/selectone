import { RestaurantForm } from '../components/restaurant/restaurantComponents';

export default function AddRestaurant() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">내 원픽 맛집 등록하기</h1>
      <p className="text-center text-gray-600 mb-8">
        전세계 어디든 당신의 원픽 맛집을 검색하고 등록해보세요!
      </p>
      <RestaurantForm hideMap={true} />
    </div>
  );
}   